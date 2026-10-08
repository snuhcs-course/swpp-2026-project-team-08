package com.mca.myapplication.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class HomeSosItem(val foodName: String, val stage: Int, val mealDate: String)

data class HomeOverview(
    val caregiverName: String = "",
    val meals: List<SavedMeal> = emptyList(),
    val sosItems: List<HomeSosItem> = emptyList(),
    val recommendation: HomeRecommendation? = null,
)

class HomeRepository(context: Context) {
    private val appContext = context.applicationContext
    private val profiles = OnboardingRepository(appContext)
    private val meals = MealCheckInRepository(appContext)
    private val reviews = AfterMealReviewRepository(appContext)
    private val recommendations = RecommendationRepository(appContext)

    suspend fun load(): Result<HomeOverview> = withContext(Dispatchers.IO) {
        runCatching {
            val profile = profiles.loadDraft().getOrThrow()
            val savedMeals = meals.savedMeals().getOrThrow()
            val tracked = linkedMapOf<String, HomeSosItem>()
            for (meal in savedMeals) {
                val draft = reviews.loadDraft(meal.id).getOrThrow()
                val food = meal.details.foods.firstOrNull { it.id == meal.details.exposureFoodId }
                val stage = draft.exposureStep?.toIntOrNull()
                if (draft.completed && food != null && stage != null && stage in 0..5) {
                    val form = listOf(food.name.trim().lowercase(), food.presentation.trim().lowercase(), food.ingredients.joinToString("|") { it.trim().lowercase() }).joinToString("::")
                    tracked.putIfAbsent(form, HomeSosItem(food.name, stage + 1, meal.details.date))
                }
            }
            HomeOverview(
                caregiverName = profile?.fields?.get("name").orEmpty(),
                meals = savedMeals,
                sosItems = tracked.values.toList(),
                recommendation = recommendations.homeSuggestion().getOrThrow(),
            )
        }
    }
}
