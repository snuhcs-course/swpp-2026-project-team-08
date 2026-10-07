package com.mca.myapplication.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

enum class RecommendationAvailability { READY, NO_MEAL, INCOMPLETE_REVIEW, SAFETY, NO_EVIDENCE, EXHAUSTED }

data class RecommendationSnapshot(
    val meal: SavedMeal? = null,
    val candidates: List<SavedSuggestion> = emptyList(),
    val saved: List<SavedSuggestion> = emptyList(),
    val availability: RecommendationAvailability = RecommendationAvailability.NO_MEAL,
)

data class HomeRecommendation(val mealId: String, val suggestion: SavedSuggestion)

/** Conservative local recommendation endpoint. It changes presentation only and never adds ingredients. */
class RecommendationRepository(context: Context) {
    private val appContext = context.applicationContext
    private val preferences = appContext.getSharedPreferences("after_meal_review", Context.MODE_PRIVATE)
    private val meals = MealCheckInRepository(appContext)
    private val reviews = AfterMealReviewRepository(appContext)
    private val profiles = OnboardingRepository(appContext)

    suspend fun homeSuggestion(): Result<HomeRecommendation?> = withContext(Dispatchers.IO) {
        runCatching {
            for (meal in meals.savedMeals().getOrThrow()) {
                val suggestion = availableSaved(meal.id).getOrThrow().lastOrNull()
                if (suggestion != null) return@runCatching HomeRecommendation(meal.id, suggestion)
            }
            null
        }
    }

    suspend fun load(mealId: String?): Result<RecommendationSnapshot> = withContext(Dispatchers.IO) {
        runCatching {
            val meal = if (mealId != null) meals.savedMeal(mealId).getOrThrow() else {
                val allMeals = meals.savedMeals().getOrThrow()
                allMeals.firstOrNull { reviews.loadDraft(it.id).getOrThrow().completed } ?: allMeals.firstOrNull()
            }
            if (meal == null) return@runCatching RecommendationSnapshot()
            val review = reviews.loadDraft(meal.id).getOrThrow()
            if (!review.completed || review.missingAnswers(meal.details.foods).isNotEmpty())
                return@runCatching RecommendationSnapshot(meal = meal, availability = RecommendationAvailability.INCOMPLETE_REVIEW)
            val profile = profiles.loadDraft().getOrThrow()
            val saved = readSaved(meal.id)
            if (!hasVerifiedProfile(profile) || meal.details.foods.none(::hasVerifiedIngredients))
                return@runCatching RecommendationSnapshot(meal, availability = RecommendationAvailability.SAFETY)
            val all = candidates(meal, review, profile!!)
            val validIds = all.map { it.id }.toSet()
            val validSaved = saved.filter { it.id in validIds }
            if (all.isEmpty()) return@runCatching RecommendationSnapshot(meal, availability = RecommendationAvailability.NO_EVIDENCE)
            val processed = readSkipped(meal.id) + saved.map { it.id }
            val remaining = all.filterNot { it.id in processed }
            RecommendationSnapshot(meal, remaining, validSaved,
                if (remaining.isEmpty()) RecommendationAvailability.EXHAUSTED else RecommendationAvailability.READY)
        }
    }

    suspend fun decide(mealId: String, candidateId: String, save: Boolean): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val snapshot = load(mealId).getOrThrow()
            val candidate = snapshot.candidates.firstOrNull { it.id == candidateId } ?: error("Recommendation is no longer available")
            if (save) {
                val current = readSaved(mealId)
                val next = current + candidate
                check(preferences.edit().putString("suggestions_$mealId", JSONArray().apply {
                    next.distinctBy { it.id }.forEach { suggestion ->
                        put(JSONObject().put("id", suggestion.id).put("title", suggestion.title)
                            .put("reason", suggestion.reason).put("servingTip", suggestion.servingTip)
                            .put("foodName", suggestion.foodName).put("kind", suggestion.kind))
                    }
                }.toString()).commit())
            } else {
                check(preferences.edit().putString("skipped_recommendations_$mealId",
                    JSONArray((readSkipped(mealId) + candidateId).distinct()).toString()).commit())
            }
        }
    }

    suspend fun availableSaved(mealId: String): Result<List<SavedSuggestion>> = withContext(Dispatchers.IO) {
        runCatching {
            val meal = meals.savedMeal(mealId).getOrThrow() ?: return@runCatching emptyList()
            val profile = profiles.loadDraft().getOrThrow()
            val review = reviews.loadDraft(mealId).getOrThrow()
            if (!review.completed || !hasVerifiedProfile(profile)) emptyList()
            else {
                val validIds = candidates(meal, review, profile!!).map { it.id }.toSet()
                readSaved(mealId).filter { it.id in validIds }
            }
        }
    }

    private fun hasVerifiedProfile(profile: OnboardingDraft?): Boolean {
        if (profile?.completed != true) return false
        // No ingredient/allergen catalog exists yet. A non-empty restriction cannot be verified by this mock.
        return profile.choices[5] == setOf("No known food allergies") &&
            profile.choices[6] == setOf("No additional dietary restrictions")
    }

    private fun hasVerifiedIngredients(food: MealFood): Boolean =
        food.source == FoodSource.PARENT && food.name.isNotBlank() &&
            food.ingredients.isNotEmpty() && food.ingredients.all(String::isNotBlank)

    private fun candidates(meal: SavedMeal, review: AfterMealReviewDraft, profile: OnboardingDraft): List<SavedSuggestion> {
        val preferences = profile.choices[13].orEmpty()
        return meal.details.foods.flatMap { food ->
            if (!hasVerifiedIngredients(food)) return@flatMap emptyList()
            val outcome = review.answers[foodOutcomeKey(food.id)]
            if (outcome == null || outcome == FoodOutcome.UNCLEAR || outcome == FoodOutcome.EATEN) return@flatMap emptyList()
            val difficulties = review.difficulties[food.id].orEmpty()
            buildList {
                if ("Foods kept separate" in preferences) add(proposal(meal.id, food, "SEPARATE"))
                if ("Ingredients clearly visible" in preferences) add(proposal(meal.id, food, "VISIBLE"))
                else if (difficulties.any { it.category == "Ingredient visibility" && it.value == "Blended / not separately visible" })
                    add(proposal(meal.id, food, "VISIBLE_RECORDED"))
            }
        }
    }

    private fun proposal(mealId: String, food: MealFood, kind: String) = SavedSuggestion(
        id = UUID.nameUUIDFromBytes("$mealId:${food.id}:$kind".toByteArray()).toString(),
        title = "", reason = "", servingTip = "", foodName = food.name, kind = kind,
    )

    private fun readSaved(mealId: String): List<SavedSuggestion> {
        val array = JSONArray(preferences.getString("suggestions_$mealId", "[]"))
        return List(array.length()) { index -> array.getJSONObject(index).let { json ->
            SavedSuggestion(json.getString("id"), json.optString("title"), json.optString("reason"),
                json.optString("servingTip"), foodName = json.optString("foodName"), kind = json.optString("kind"))
        } }
    }

    private fun readSkipped(mealId: String): List<String> {
        val array = JSONArray(preferences.getString("skipped_recommendations_$mealId", "[]"))
        return List(array.length(), array::getString)
    }
}
