package com.mca.myapplication

import android.content.Context
import android.content.ContextWrapper
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mca.myapplication.data.*
import kotlinx.coroutines.*
import org.junit.Assert.*
import org.junit.After
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class AfterMealReviewTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val store = ViewModelStore()
    private val food = MealFood(id = "food", name = "Rice", ingredients = listOf("Rice"))
    private val fake = FakeRepository(SavedMeal("meal", MealCheckInDraft(photoPath = "before", foods = listOf(food)), 0))
    private lateinit var vm: AfterMealReviewViewModel
    private fun main(action: () -> Unit) = instrumentation.runOnMainSync(action)
    private fun await(condition: () -> Boolean) {
        val until = System.currentTimeMillis() + 5000
        while (!condition() && System.currentTimeMillis() < until) Thread.sleep(20)
        assertTrue("Timed out", condition())
    }
    private fun start() {
        main { vm = ViewModelProvider(store, AfterMealReviewViewModel.Factory(fake))[AfterMealReviewViewModel::class.java]; vm.open("meal") }
        await { !vm.state.value.loading }
    }
    @After fun clear() { main { store.clear() } }

    @Test fun lateComparisonCannotOverwriteManualAnswers() {
        start()
        main { vm.compare() }
        await { vm.state.value.comparing }
        main { vm.manual(); vm.answer(foodOutcomeKey(food.id), FoodOutcome.UNCLEAR) }
        await { vm.state.value.draft?.stage == ReviewStage.OUTCOMES }
        main { vm.answer(foodOutcomeKey(food.id), FoodOutcome.UNCLEAR) }
        fake.comparison.complete(Result.success(mapOf(foodOutcomeKey(food.id) to FoodOutcome.EATEN)))
        Thread.sleep(150)
        assertEquals(ReviewStage.OUTCOMES, vm.state.value.draft?.stage)
        assertTrue(vm.state.value.draft!!.suggestions.isEmpty())
        assertEquals(FoodOutcome.UNCLEAR, vm.state.value.draft!!.answers[foodOutcomeKey(food.id)])
    }
    @Test fun failedSaveKeepsCurrentScreenAndCanRetry() {
        start()
        fake.failSave = true
        main { vm.manual() }
        await { vm.state.value.saveFailed }
        assertEquals(ReviewStage.COMPARE, vm.state.value.draft!!.stage)
        fake.failSave = false
        main { vm.manual() }
        await { vm.state.value.draft?.stage == ReviewStage.OUTCOMES }
        assertFalse(vm.state.value.saveFailed)
    }
    @Test fun unansweredSuggestionsCannotAdvanceAndLatestAnswerWins() {
        start()
        main { vm.manual() }
        await { vm.state.value.draft?.stage == ReviewStage.OUTCOMES }
        main { vm.continueOutcomes() }
        assertEquals(2, vm.state.value.missing.size)
        main {
            repeat(12) { vm.answer(foodOutcomeKey(food.id), FoodOutcome.EATEN) }
            vm.answer(foodOutcomeKey(food.id), FoodOutcome.UNTOUCHED)
            vm.answer(ingredientOutcomeKey(food.id, "Rice"), FoodOutcome.UNCLEAR)
            vm.continueOutcomes()
        }
        await { vm.state.value.draft?.stage == ReviewStage.DIFFICULTY && !vm.state.value.saving }
        assertEquals(FoodOutcome.UNTOUCHED, fake.draft.answers[foodOutcomeKey(food.id)])
        assertEquals(FoodOutcome.UNCLEAR, fake.draft.answers[ingredientOutcomeKey(food.id, "Rice")])
    }
    @Test fun emptyComparisonIsFailureAndManualClearsSuggestions() {
        start()
        main { vm.compare() }
        fake.comparison.complete(Result.success(emptyMap()))
        await { vm.state.value.comparisonFailed }
        assertEquals(ReviewStage.COMPARE, vm.state.value.draft!!.stage)
        main { vm.manual() }
        await { vm.state.value.draft?.stage == ReviewStage.OUTCOMES }
        assertTrue(vm.state.value.draft!!.suggestions.isEmpty())
    }
    @Test fun finalSaveFailureDoesNotMarkCompleted() {
        fake.draft = fake.draft.copy(stage = ReviewStage.DIFFICULTY, answers = food.outcomeKeys().associateWith { FoodOutcome.UNCLEAR })
        start()
        fake.failSave = true
        main { vm.afterDifficulty() }
        await { vm.state.value.saveFailed }
        assertFalse(vm.state.value.draft!!.completed)
        assertEquals(ReviewStage.DIFFICULTY, vm.state.value.draft!!.stage)
        fake.failSave = false
        main { vm.afterDifficulty() }
        await { vm.state.value.draft!!.completed }
        assertEquals(ReviewStage.DONE, fake.draft.stage)
    }
    @Test fun repositoryRoundTripAndAfterPhotoNeverChangesBeforePhoto() = runBlocking {
        val prefix = "review-test-${UUID.randomUUID()}-"
        val context = object : ContextWrapper(instrumentation.targetContext) {
            override fun getApplicationContext(): Context = this
            override fun getSharedPreferences(name: String, mode: Int) = super.getSharedPreferences(prefix + name, mode)
        }
        val meals = MealCheckInRepository(context)
        val repository = AfterMealReviewRepository(context)
        val before = repository.saveCameraPhoto(Bitmap.createBitmap(180, 180, Bitmap.Config.ARGB_8888)).getOrThrow()
        val after = repository.saveCameraPhoto(Bitmap.createBitmap(181, 181, Bitmap.Config.ARGB_8888)).getOrThrow()
        try {
            meals.saveMeal(MealCheckInDraft(photoPath = before, foods = listOf(food))).getOrThrow()
            val saved = meals.savedMeals().getOrThrow().single()
            val draft = AfterMealReviewDraft(saved.id, ReviewStage.DIFFICULTY, after,
                suggestions = mapOf(foodOutcomeKey(food.id) to FoodOutcome.EATEN),
                answers = food.outcomeKeys().associateWith { FoodOutcome.UNCLEAR },
                difficulties = mapOf(food.id to listOf(DifficultyTag("Texture", "Other", "grainy"))),
                exposureStep = "2", savedSuggestionAnswers = mapOf("saved" to false),
                difficultyInputs = mapOf(food.id to DifficultyInput("Color", "Others", "in progress")))
            repository.saveDraft(draft).getOrThrow()
            assertEquals(draft, AfterMealReviewRepository(context).loadDraft(saved.id).getOrThrow())
            repository.saveDraft(draft.copy(afterPhotoPath = null)).getOrThrow()
            assertEquals(before, meals.savedMeal(saved.id).getOrThrow()!!.details.photoPath)
            assertNull(repository.loadDraft(saved.id).getOrThrow().afterPhotoPath)
            assertTrue(repository.comparePhotos(saved, after).getOrThrow().isNotEmpty())
            assertTrue(repository.comparePhotos(saved, "missing").isFailure)
        } finally {
            java.io.File(before).delete(); java.io.File(after).delete()
            listOf("meal_checkin", "after_meal_review", "onboarding").forEach { context.getSharedPreferences(it, Context.MODE_PRIVATE).edit().clear().commit() }
        }
    }
    private class FakeRepository(val meal: SavedMeal) : ReviewRepository {
        @Volatile var draft = AfterMealReviewDraft(meal.id, ReviewStage.COMPARE, "after")
        @Volatile var failSave = false
        val comparison = CompletableDeferred<Result<Map<String, FoodOutcome>>>()
        override suspend fun savedMeals() = Result.success(listOf(meal))
        override suspend fun savedMeal(id: String) = Result.success(meal)
        override suspend fun updateSavedFoods(id: String, foods: List<MealFood>) = Result.success(Unit)
        override suspend fun importPhoto(uri: Uri) = Result.success("after")
        override suspend fun saveCameraPhoto(bitmap: Bitmap) = Result.success("after")
        override suspend fun loadDraft(mealId: String) = Result.success(draft)
        override suspend fun saveDraft(draft: AfterMealReviewDraft): Result<Unit> {
            delay(5)
            if (failSave) return Result.failure(IllegalStateException("Test disk failure"))
            this.draft = draft
            return Result.success(Unit)
        }
        override suspend fun comparePhotos(meal: SavedMeal, afterPhotoPath: String) = withContext(NonCancellable) { comparison.await() }
        override suspend fun savedSuggestions(mealId: String) = Result.success(emptyList<SavedSuggestion>())
    }
}
