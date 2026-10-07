package com.mca.myapplication

import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.mca.myapplication.data.*
import com.mca.myapplication.ui.theme.MyApplicationTheme
import org.junit.Rule
import org.junit.Test
import java.io.File
import java.util.Locale

class AfterMealReviewScreenTest {
    @get:Rule val compose = createComposeRule()
    @Test fun reviewScreensRemainReachableAndRenderInBothLanguages() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val photo = File(context.filesDir, "review-test-photo.jpg")
        BitmapFactory.decodeResource(context.resources, R.drawable.meal_example_photo).let { bitmap -> photo.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, 90, it) }; bitmap.recycle() }
        val food = MealFood(id = "rice", name = "Steamed rice", ingredients = listOf("Rice", "Water"), exposureGoal = "Step 1 · Look")
        val meal = SavedMeal("review-ui", MealCheckInDraft(date = "2026-10-07", photoPath = photo.path, foods = listOf(food), exposureFoodId = food.id), 0, "Alex")
        var state by mutableStateOf(AfterMealReviewUiState(meal = meal, loading = false, draft = AfterMealReviewDraft(meal.id, afterPhotoPath = photo.path)))
        var korean by mutableStateOf(false)
        compose.setContent {
            val config = Configuration(LocalConfiguration.current).apply { setLocale(Locale.forLanguageTag(if (korean) "ko" else "en")) }
            CompositionLocalProvider(LocalConfiguration provides config) { MyApplicationTheme { AfterMealReviewScreen(state, {}, {}) } }
        }
        fun capture(name: String) {
            compose.waitForIdle()
            InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot().let { bitmap ->
                File(context.filesDir, "review-$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }; bitmap.recycle()
            }
        }
        compose.onNodeWithText("Add an after-meal photo").assertIsDisplayed()
        capture("add")
        compose.runOnIdle { state = state.copy(draft = state.draft!!.copy(stage = ReviewStage.COMPARE)) }
        compose.onNodeWithText("Compare with AI").assertIsDisplayed()
        capture("compare")
        compose.runOnIdle { state = state.copy(draft = state.draft!!.copy(stage = ReviewStage.OUTCOMES, suggestions = food.outcomeKeys().associateWith { FoodOutcome.EATEN })) }
        compose.onAllNodesWithText("SUGGESTED").assertCountEquals(3)
        compose.onNodeWithText("Continue").assertIsDisplayed()
        capture("outcomes")
        compose.runOnIdle { state = state.copy(draft = state.draft!!.copy(stage = ReviewStage.DIFFICULTY, difficultyInputs = mapOf(food.id to DifficultyInput("Shape and size", "Not sure", "Pieces were different sizes")), difficulties = mapOf(food.id to listOf(DifficultyTag("Color", "Yellow"))))) }
        compose.onNodeWithText("Skip").assertIsDisplayed()
        compose.onNodeWithText("Shape and size").performClick()
        compose.onNodeWithText("Temperature").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("Temperature").performClick()
        capture("difficulty")
        compose.runOnIdle { korean = true; state = state.copy(draft = state.draft!!.copy(stage = ReviewStage.OUTCOMES)) }
        compose.onNodeWithText("계속").assertIsDisplayed()
        compose.onNodeWithText("각 음식에 어떤 반응을 보였나요?").assertIsDisplayed()
        capture("outcomes-ko")
        compose.runOnIdle { state = state.copy(dialog = ReviewDialog.DEFINITIONS) }
        compose.onNodeWithText("알겠어요").assertIsDisplayed()
        capture("definitions-ko")
        photo.delete()
    }
}
