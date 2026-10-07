package com.mca.myapplication

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.mca.myapplication.data.FoodSource
import com.mca.myapplication.data.MealCheckInDraft
import com.mca.myapplication.data.MealCheckInRepository
import com.mca.myapplication.data.MealFood
import com.mca.myapplication.data.withParentReviewedFood
import com.mca.myapplication.data.confirmedByParent
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.isActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.asStateFlow

data class MealCheckInUiState(
    val draft: MealCheckInDraft = MealCheckInDraft(),
    val isLoaded: Boolean = false,
    val isSaving: Boolean = false,
    val saveFailed: Boolean = false,
    val isImportingPhoto: Boolean = false,
    val photoError: String? = null,
    val isAnalyzing: Boolean = false,
    val analysisFailed: Boolean = false,
    val saveCompleted: Boolean = false,
    val savedMealId: String? = null,
    val exposureSheet: ExposureSheet = ExposureSheet.NONE,
    val selectedExposureFoodId: String? = null,
)

enum class ExposureSheet { NONE, SELECT, EXPLANATION }

class MealCheckInViewModel(private val repository: MealCheckInRepository) : ViewModel() {
    private val mutableState = kotlinx.coroutines.flow.MutableStateFlow(MealCheckInUiState())
    val state = mutableState.asStateFlow()
    private var autoSaveJob: Job? = null
    private var analysisJob: Job? = null
    private var loadJob: Job? = null
    private val persistenceMutex = Mutex()

    init {
        loadJob = viewModelScope.launch {
            val result = repository.loadDraft()
            if (mutableState.value.isLoaded) return@launch
            mutableState.value = mutableState.value.copy(draft = result.getOrNull() ?: MealCheckInDraft(), saveFailed = result.isFailure, isLoaded = true)
        }
    }

    fun update(details: MealCheckInDraft) {
        mutableState.value = mutableState.value.copy(draft = details, photoError = null, saveCompleted = false, savedMealId = null)
        scheduleSave(details)
    }

    fun choosePhoto(uri: Uri) {
        mutableState.value = mutableState.value.copy(isImportingPhoto = true, photoError = null)
        viewModelScope.launch {
            repository.importPhoto(uri).fold(
                onSuccess = { path -> changeDraft { it.copy(photoPath = path, stage = 2) }; mutableState.value = mutableState.value.copy(isImportingPhoto = false) },
                onFailure = { error -> mutableState.value = mutableState.value.copy(isImportingPhoto = false, photoError = error.message) },
            )
        }
    }

    fun chooseCameraPhoto(bitmap: Bitmap) {
        mutableState.value = mutableState.value.copy(isImportingPhoto = true, photoError = null)
        viewModelScope.launch {
            repository.saveCameraPhoto(bitmap).fold(
                onSuccess = { path -> changeDraft { it.copy(photoPath = path, stage = 2) }; mutableState.value = mutableState.value.copy(isImportingPhoto = false) },
                onFailure = { error -> mutableState.value = mutableState.value.copy(isImportingPhoto = false, photoError = error.message) },
            )
        }
    }

    fun setStage(stage: Int) = changeDraft { it.copy(stage = stage.coerceIn(0, 4)) }

    fun removePhoto() = changeDraft { it.copy(photoPath = null, stage = 1) }

    fun analyzePhoto(language: String) {
        val path = mutableState.value.draft.photoPath ?: run {
            mutableState.value = mutableState.value.copy(analysisFailed = true)
            return
        }
        analysisJob?.cancel()
        changeDraft { it.copy(stage = 3) }
        mutableState.value = mutableState.value.copy(isAnalyzing = true, analysisFailed = false)
        analysisJob = viewModelScope.launch {
            delay(250)
            val result = repository.analyzePhoto(path, language)
            if (!currentCoroutineContext().isActive) return@launch
            result.fold(
                onSuccess = { foods ->
                    changeDraft { it.copy(stage = 4, foods = foods) }
                    mutableState.value = mutableState.value.copy(isAnalyzing = false)
                },
                onFailure = {
                    mutableState.value = mutableState.value.copy(isAnalyzing = false, analysisFailed = true)
                },
            )
        }
    }

    fun cancelAnalysis() {
        analysisJob?.cancel()
        mutableState.value = mutableState.value.copy(isAnalyzing = false)
        setStage(3)
    }

    fun openManualEntry() {
        mutableState.value = mutableState.value.copy(isAnalyzing = false, analysisFailed = false)
        setStage(4)
    }

    fun addFood(name: String) {
        val cleanName = name.trim()
        if (cleanName.isBlank()) return
        changeDraft { it.copy(foods = it.foods + MealFood(name = cleanName, source = FoodSource.PARENT)) }
    }

    fun updateFood(food: MealFood) = changeDraft { it.withParentReviewedFood(food) }

    fun removeFood(id: String) = changeDraft { draft -> draft.copy(foods = draft.foods.filterNot { it.id == id }, exposureFoodId = draft.exposureFoodId.takeUnless { it == id }) }

    fun requestExposureGoal() {
        val draft = mutableState.value.draft
        if (draft.foods.isEmpty()) return
        val confirmedDraft = draft.confirmedByParent()
        mutableState.value = mutableState.value.copy(
            draft = confirmedDraft,
            exposureSheet = ExposureSheet.SELECT,
            selectedExposureFoodId = draft.exposureFoodId ?: confirmedDraft.foods.first().id,
            saveFailed = false,
        )
        scheduleSave(confirmedDraft)
    }

    fun selectExposureFood(id: String) {
        if (mutableState.value.draft.foods.any { it.id == id }) mutableState.value = mutableState.value.copy(selectedExposureFoodId = id)
    }

    fun showExposureExplanation() {
        mutableState.value = mutableState.value.copy(exposureSheet = ExposureSheet.EXPLANATION)
    }

    fun backToExposureSelection() {
        mutableState.value = mutableState.value.copy(exposureSheet = ExposureSheet.SELECT)
    }

    fun dismissExposureSheet() {
        mutableState.value = mutableState.value.copy(exposureSheet = ExposureSheet.NONE)
    }

    fun skipExposureGoal() = persistConfirmedMeal(mutableState.value.draft.copy(exposureFoodId = null))

    fun confirmExposureGoal() {
        val selectedId = mutableState.value.selectedExposureFoodId ?: return
        if (mutableState.value.draft.foods.none { it.id == selectedId }) return
        persistConfirmedMeal(mutableState.value.draft.copy(exposureFoodId = selectedId))
    }

    private fun persistConfirmedMeal(confirmedDraft: MealCheckInDraft) {
        autoSaveJob?.cancel()
        mutableState.value = mutableState.value.copy(draft = confirmedDraft, isSaving = true, saveFailed = false)
        viewModelScope.launch {
            autoSaveJob?.cancelAndJoin()
            val result = persistenceMutex.withLock { repository.saveMeal(confirmedDraft) }
            result.fold(
                onSuccess = { mealId -> mutableState.value = mutableState.value.copy(draft = MealCheckInDraft(), isSaving = false, saveCompleted = true, savedMealId = mealId, exposureSheet = ExposureSheet.NONE, selectedExposureFoodId = null) },
                onFailure = { mutableState.value = mutableState.value.copy(isSaving = false, saveFailed = true) },
            )
        }
    }

    fun startNewMeal() {
        loadJob?.cancel()
        mutableState.value = mutableState.value.copy(draft = MealCheckInDraft(), isLoaded = true, analysisFailed = false, saveCompleted = false, savedMealId = null, saveFailed = false, exposureSheet = ExposureSheet.NONE, selectedExposureFoodId = null)
        scheduleSave(MealCheckInDraft())
    }

    fun resumeDraft() {
        loadJob?.cancel()
        mutableState.value = mutableState.value.copy(isLoaded = true, analysisFailed = false, isAnalyzing = false, saveCompleted = false, savedMealId = null, exposureSheet = ExposureSheet.NONE)
    }

    private fun changeDraft(transform: (MealCheckInDraft) -> MealCheckInDraft) {
        val updated = transform(mutableState.value.draft)
        mutableState.value = mutableState.value.copy(draft = updated, saveCompleted = false, savedMealId = null)
        scheduleSave(updated)
    }

    private fun scheduleSave(draft: MealCheckInDraft) {
        if (!mutableState.value.isLoaded) return
        autoSaveJob?.cancel()
        autoSaveJob = viewModelScope.launch {
            delay(180)
            mutableState.value = mutableState.value.copy(isSaving = true, saveFailed = false)
            persistenceMutex.withLock { repository.saveDraft(draft) }.fold(
                onSuccess = { mutableState.value = mutableState.value.copy(isSaving = false) },
                onFailure = { mutableState.value = mutableState.value.copy(isSaving = false, saveFailed = true) },
            )
        }
    }

    class Factory(context: Context) : ViewModelProvider.Factory {
        private val repository = MealCheckInRepository(context.applicationContext)

        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            require(modelClass.isAssignableFrom(MealCheckInViewModel::class.java))
            return MealCheckInViewModel(repository) as T
        }
    }
}
