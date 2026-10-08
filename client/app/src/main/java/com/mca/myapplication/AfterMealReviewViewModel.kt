package com.mca.myapplication

import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.mca.myapplication.data.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class AfterMealReviewUiState(
    val meals: List<SavedMeal> = emptyList(),
    val meal: SavedMeal? = null,
    val draft: AfterMealReviewDraft? = null,
    val loading: Boolean = true,
    val loadFailed: Boolean = false,
    val saving: Boolean = false,
    val saveFailed: Boolean = false,
    val transitioning: Boolean = false,
    val importing: Boolean = false,
    val photoFailed: Boolean = false,
    val comparing: Boolean = false,
    val elapsedSeconds: Int = 0,
    val comparisonFailed: Boolean = false,
    val missing: Set<String> = emptySet(),
    val noFoods: Boolean = false,
    val savedSuggestions: List<SavedSuggestion> = emptyList(),
    val suggestionIndex: Int = 0,
    val dialog: ReviewDialog = ReviewDialog.NONE,
    val editingFood: MealFood? = null,
    val fullPhoto: String? = null,
    val exitReady: Boolean = false,
)
enum class ReviewDialog { NONE, DEFINITIONS, PHOTO_USE, PHOTO_SOURCES }

class AfterMealReviewViewModel(private val repository: ReviewRepository) : ViewModel() {
    private val mutable = MutableStateFlow(AfterMealReviewUiState())
    val state = mutable.asStateFlow()
    private var loadJob: Job? = null
    private var comparisonJob: Job? = null
    private var clockJob: Job? = null
    private var revision = 0L
    private data class Write(val draft: AfterMealReviewDraft, val revision: Long, val next: ReviewStage? = null, val exit: Boolean = false)
    private val writes = Channel<Write>(Channel.UNLIMITED)

    init {
        viewModelScope.launch {
            for (write in writes) {
                val persisted = write.next?.let { write.draft.copy(stage = it, completed = it == ReviewStage.DONE) } ?: write.draft
                val result = repository.saveDraft(persisted)
                if (write.revision == revision && mutable.value.draft?.mealId == write.draft.mealId) {
                    mutable.value = mutable.value.copy(
                        draft = if (result.isSuccess) persisted else mutable.value.draft,
                        saving = false, saveFailed = result.isFailure, transitioning = false,
                        exitReady = write.exit && result.isSuccess,
                    )
                }
            }
        }
    }

    fun open(mealId: String?) {
        cancelComparison()
        loadJob?.cancel()
        mutable.value = AfterMealReviewUiState()
        loadJob = viewModelScope.launch {
            if (mealId == null) {
                val result = repository.savedMeals()
                mutable.value = mutable.value.copy(meals = result.getOrDefault(emptyList()), loading = false, loadFailed = result.isFailure)
            } else {
                val meal = repository.savedMeal(mealId)
                val draft = repository.loadDraft(mealId)
                val suggestions = repository.savedSuggestions(mealId)
                val savedMeal = meal.getOrNull()
                if (savedMeal == null || draft.isFailure || suggestions.isFailure) {
                    mutable.value = mutable.value.copy(loading = false, loadFailed = true)
                } else {
                    val restored = draft.getOrThrow().reconcile(savedMeal.details.foods)
                    val cards = suggestions.getOrThrow()
                    mutable.value = mutable.value.copy(meal = savedMeal, draft = restored, loading = false,
                        savedSuggestions = cards, suggestionIndex = cards.indexOfFirst { it.id !in restored.savedSuggestionAnswers }.let { if (it < 0) cards.size else it })
                }
            }
        }
    }

    private fun change(transform: (AfterMealReviewDraft) -> AfterMealReviewDraft) {
        val old = mutable.value.draft ?: return
        if (mutable.value.transitioning) return
        val draft = transform(old).copy(completed = false)
        mutable.value = mutable.value.copy(draft = draft, saving = true, saveFailed = false)
        writes.trySend(Write(draft, ++revision))
    }

    fun retrySave() {
        val draft = mutable.value.draft ?: return
        mutable.value = mutable.value.copy(saving = true, saveFailed = false)
        writes.trySend(Write(draft, ++revision))
    }
    fun showDialog(dialog: ReviewDialog) { mutable.value = mutable.value.copy(dialog = dialog) }
    fun fullPhoto(path: String?) { mutable.value = mutable.value.copy(fullPhoto = path) }
    fun photoError() { mutable.value = mutable.value.copy(photoFailed = true) }
    fun choosePhoto(uri: Uri) = import { repository.importPhoto(uri) }
    fun chooseCameraPhoto(bitmap: Bitmap) = import { repository.saveCameraPhoto(bitmap) }
    private fun import(action: suspend () -> Result<String>) {
        if (mutable.value.importing || mutable.value.transitioning) return
        mutable.value = mutable.value.copy(importing = true, photoFailed = false, dialog = ReviewDialog.NONE)
        viewModelScope.launch {
            val result = action()
            result.onSuccess { path -> change { it.copy(afterPhotoPath = path, stage = ReviewStage.PREVIEW, suggestions = emptyMap()) } }
            mutable.value = mutable.value.copy(importing = false, photoFailed = result.isFailure)
        }
    }
    fun removePhoto() { change { it.copy(afterPhotoPath = null, suggestions = emptyMap(), stage = ReviewStage.ADD_PHOTO) } }
    fun answer(key: String, value: FoodOutcome) {
        if (key !in mutable.value.meal?.details?.foods.orEmpty().flatMap { it.outcomeKeys() }) return
        change { it.copy(answers = it.answers + (key to value)) }
        mutable.value = mutable.value.copy(missing = mutable.value.missing - key)
    }
    fun input(foodId: String, input: DifficultyInput) { change { it.copy(difficultyInputs = it.difficultyInputs + (foodId to input)) } }
    fun addDifficulty(foodId: String) {
        val input = mutable.value.draft?.difficultyInputs?.get(foodId) ?: return
        val tag = input.toTag() ?: return
        change { it.copy(difficulties = it.difficulties + (foodId to it.difficulties[foodId].orEmpty().adding(tag)), difficultyInputs = it.difficultyInputs - foodId) }
    }
    fun removeDifficulty(foodId: String, tag: DifficultyTag) { change { it.copy(difficulties = it.difficulties + (foodId to (it.difficulties[foodId].orEmpty() - tag))) } }
    fun exposure(step: String) { change { it.copy(exposureStep = step) } }
    fun editFood(food: MealFood?) { mutable.value = mutable.value.copy(editingFood = food) }
    fun saveFood(food: MealFood) {
        val meal = mutable.value.meal ?: return
        if (mutable.value.transitioning) return
        val foods = meal.details.withParentReviewedFood(food.copy(ingredients = food.ingredients.distinct())).foods
        mutable.value = mutable.value.copy(transitioning = true, saving = true, saveFailed = false)
        viewModelScope.launch {
            val result = repository.updateSavedFoods(meal.id, foods)
            mutable.value = mutable.value.copy(transitioning = false, saving = false, saveFailed = result.isFailure)
            if (result.isSuccess) {
                mutable.value = mutable.value.copy(meal = meal.copy(details = meal.details.copy(foods = foods)), editingFood = null, missing = emptySet(), noFoods = false)
                change { it.reconcile(foods) }
            }
        }
    }
    fun compare() {
        val meal = mutable.value.meal ?: return
        val draft = mutable.value.draft ?: return
        if (mutable.value.transitioning) return
        val photo = draft.afterPhotoPath ?: return photoError()
        cancelComparison()
        mutable.value = mutable.value.copy(comparing = true, comparisonFailed = false, elapsedSeconds = 0)
        clockJob = viewModelScope.launch { while (isActive) { delay(1000); mutable.value = mutable.value.copy(elapsedSeconds = mutable.value.elapsedSeconds + 1) } }
        comparisonJob = viewModelScope.launch {
            val result = repository.comparePhotos(meal, photo)
            if (!isActive) return@launch
            clockJob?.cancel()
            mutable.value = mutable.value.copy(comparing = false)
            if (result.isSuccess && result.getOrThrow().isNotEmpty()) {
                change { it.copy(suggestions = result.getOrThrow()).reconcile(meal.details.foods) }
                transition(ReviewStage.OUTCOMES)
            } else mutable.value = mutable.value.copy(comparisonFailed = true)
        }
    }
    fun cancelComparison() {
        comparisonJob?.cancel(); clockJob?.cancel()
        mutable.value = mutable.value.copy(comparing = false, comparisonFailed = false)
    }
    fun manual() { cancelComparison(); change { it.copy(suggestions = emptyMap()) }; transition(ReviewStage.OUTCOMES) }
    fun transition(next: ReviewStage, exit: Boolean = false) {
        val draft = mutable.value.draft ?: return
        if (mutable.value.transitioning || mutable.value.importing) return
        mutable.value = mutable.value.copy(saving = true, saveFailed = false, transitioning = true)
        writes.trySend(Write(draft, ++revision, next, exit))
    }
    fun continueOutcomes() {
        val draft = mutable.value.draft ?: return
        val foods = mutable.value.meal?.details?.foods.orEmpty()
        val missing = draft.missingAnswers(foods)
        mutable.value = mutable.value.copy(missing = missing, noFoods = foods.isEmpty())
        if (missing.isEmpty() && foods.isNotEmpty()) transition(ReviewStage.DIFFICULTY)
    }
    private fun goalFood(): MealFood? = mutable.value.meal?.details?.let { details -> details.foods.firstOrNull { it.id == details.exposureFoodId } }
    fun afterDifficulty() { if (goalFood() != null) transition(ReviewStage.EXPOSURE_GOAL) else afterGoal() }
    fun afterGoal() { if (mutable.value.savedSuggestions.isNotEmpty()) transition(ReviewStage.SUGGESTIONS) else finish() }
    fun suggestion(tried: Boolean) {
        val state = mutable.value
        val card = state.savedSuggestions.getOrNull(state.suggestionIndex) ?: return
        if (state.transitioning) return
        change { it.copy(savedSuggestionAnswers = it.savedSuggestionAnswers + (card.id to tried)) }
        mutable.value = mutable.value.copy(suggestionIndex = state.suggestionIndex + 1)
    }
    fun finish() {
        val draft = mutable.value.draft ?: return
        val foods = mutable.value.meal?.details?.foods.orEmpty()
        if (foods.isEmpty() || draft.missingAnswers(foods).isNotEmpty()) { transition(ReviewStage.OUTCOMES); return }
        transition(ReviewStage.DONE)
    }
    fun consumeExit() { mutable.value = mutable.value.copy(exitReady = false) }
    fun exit() {
        cancelComparison()
        val stage = mutable.value.draft?.stage ?: run { mutable.value = mutable.value.copy(exitReady = true); return }
        transition(stage, exit = true)
    }
    fun back() {
        val state = mutable.value
        if (state.transitioning || state.importing) return
        when {
            state.fullPhoto != null -> fullPhoto(null)
            state.dialog != ReviewDialog.NONE -> showDialog(ReviewDialog.NONE)
            state.editingFood != null -> editFood(null)
            state.comparing || state.comparisonFailed -> cancelComparison()
            else -> when (state.draft?.stage) {
                null, ReviewStage.ADD_PHOTO -> exit()
                ReviewStage.PREVIEW -> transition(ReviewStage.ADD_PHOTO)
                ReviewStage.COMPARE -> transition(ReviewStage.PREVIEW)
                ReviewStage.OUTCOMES -> transition(ReviewStage.COMPARE)
                ReviewStage.DIFFICULTY -> transition(ReviewStage.OUTCOMES)
                ReviewStage.EXPOSURE_GOAL -> transition(ReviewStage.DIFFICULTY)
                ReviewStage.EXPOSURE_RECORD -> transition(ReviewStage.EXPOSURE_GOAL)
                ReviewStage.SUGGESTIONS -> if (state.suggestionIndex > 0) mutable.value = state.copy(suggestionIndex = state.suggestionIndex - 1) else transition(if (goalFood() != null) ReviewStage.EXPOSURE_GOAL else ReviewStage.DIFFICULTY)
                ReviewStage.DONE -> exit()
            }
        }
    }
    class Factory(private val repository: ReviewRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = AfterMealReviewViewModel(repository) as T
    }
}
