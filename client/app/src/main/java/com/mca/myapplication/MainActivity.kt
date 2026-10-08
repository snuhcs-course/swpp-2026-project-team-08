package com.mca.myapplication

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mca.myapplication.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val onboardingViewModel = ViewModelProvider(this, OnboardingViewModel.Factory(applicationContext))[OnboardingViewModel::class.java]
        val mealCheckInViewModel = ViewModelProvider(this, MealCheckInViewModel.Factory(applicationContext))[MealCheckInViewModel::class.java]
        val reviewViewModel = ViewModelProvider(this, AfterMealReviewViewModel.Factory(com.mca.myapplication.data.AfterMealReviewRepository(applicationContext)))[AfterMealReviewViewModel::class.java]
        val recommendationViewModel = ViewModelProvider(this, RecommendationViewModel.Factory(com.mca.myapplication.data.RecommendationRepository(applicationContext)))[RecommendationViewModel::class.java]
        val homeViewModel = ViewModelProvider(this, HomeViewModel.Factory(com.mca.myapplication.data.HomeRepository(applicationContext)))[HomeViewModel::class.java]
        setContent { MyApplicationTheme { NurtureBitesApp(onboardingViewModel, mealCheckInViewModel, reviewViewModel, recommendationViewModel, homeViewModel) } }
    }
}

@Composable
private fun NurtureBitesApp(onboarding: OnboardingViewModel, mealCheckIn: MealCheckInViewModel, review: AfterMealReviewViewModel, recommendation: RecommendationViewModel, home: HomeViewModel) {
    val mealState by mealCheckIn.state.collectAsStateWithLifecycle()
    var showMealCheckIn by rememberSaveable { mutableStateOf(false) }
    var reviewAfterMealSave by rememberSaveable { mutableStateOf(false) }
    var showReview by rememberSaveable { mutableStateOf(false) }
    var reviewMealId by rememberSaveable { mutableStateOf<String?>(null) }
    var showRecommendation by rememberSaveable { mutableStateOf(false) }
    var recommendationMealId by rememberSaveable { mutableStateOf<String?>(null) }
    var recommendationFromReview by rememberSaveable { mutableStateOf(false) }
    var editProfile by rememberSaveable { mutableStateOf(false) }
    var profileFromRecommendation by rememberSaveable { mutableStateOf(false) }
    if (editProfile) {
        OnboardingApp(onboarding, home, hasMealDraft = false, onOpenReview = {}, onOpenRecommendation = {},
            editingProfile = true, onExitProfileEdit = { editProfile = false; showRecommendation = profileFromRecommendation }, onOpenMealCheckIn = {})
    } else if (showRecommendation) {
        RecommendationRoute(recommendation, recommendationMealId, onBack = {
            showRecommendation = false
            recommendationMealId = null
            if (!recommendationFromReview) { showReview = false; reviewMealId = null }
            recommendationFromReview = false
        }, onProfileReview = {
            showRecommendation = false
            profileFromRecommendation = true
            editProfile = true
        }, onMealReview = { id ->
            showRecommendation = false
            reviewMealId = id
            showReview = true
        })
    } else if (showReview) {
        AfterMealReviewRoute(review, reviewMealId, { reviewMealId = it }, { showReview = false; reviewMealId = null }, { id ->
            recommendationMealId = id
            recommendationFromReview = true
            showRecommendation = true
        })
    } else if (showMealCheckIn) {
        MealCheckInScreen(mealCheckIn,
            onExit = { reviewAfterMealSave = false; showMealCheckIn = false },
            onOpenReview = { id ->
                reviewAfterMealSave = false
                showMealCheckIn = false
                reviewMealId = id
                showReview = true
            },
            autoOpenReview = reviewAfterMealSave,
        )
    } else {
        val draft = mealState.draft
        val hasMealDraft = mealState.isLoaded && (draft.stage > 0 || draft.photoPath != null || draft.foods.isNotEmpty() || draft.mealType.isNotBlank() || draft.setting.isNotBlank())
        OnboardingApp(onboarding, home, hasMealDraft, onOpenReview = { id -> reviewMealId = id; showReview = true }, onOpenRecommendation = { id ->
            recommendationMealId = id
            recommendationFromReview = false
            showRecommendation = true
        }, onProfileEdit = {
            profileFromRecommendation = false
            editProfile = true
        }, onReviewDraft = {
            reviewAfterMealSave = true
            mealCheckIn.resumeDraft()
            showMealCheckIn = true
        }) { resume ->
            reviewAfterMealSave = false
            if (resume) mealCheckIn.resumeDraft() else mealCheckIn.startNewMeal()
            showMealCheckIn = true
        }
    }
}
