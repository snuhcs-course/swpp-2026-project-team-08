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
        setContent { MyApplicationTheme { NurtureBitesApp(onboardingViewModel, mealCheckInViewModel) } }
    }
}

@Composable
private fun NurtureBitesApp(onboarding: OnboardingViewModel, mealCheckIn: MealCheckInViewModel) {
    val mealState by mealCheckIn.state.collectAsStateWithLifecycle()
    var showMealCheckIn by rememberSaveable { mutableStateOf(false) }
    if (showMealCheckIn) {
        MealCheckInScreen(mealCheckIn, onExit = { showMealCheckIn = false })
    } else {
        val draft = mealState.draft
        val hasMealDraft = mealState.isLoaded && (draft.stage > 0 || draft.photoPath != null || draft.foods.isNotEmpty() || draft.mealType.isNotBlank() || draft.setting.isNotBlank())
        OnboardingApp(onboarding, hasMealDraft) { resume ->
            if (resume) mealCheckIn.resumeDraft() else mealCheckIn.startNewMeal()
            showMealCheckIn = true
        }
    }
}
