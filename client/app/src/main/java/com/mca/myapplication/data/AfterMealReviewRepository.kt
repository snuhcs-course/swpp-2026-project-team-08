package com.mca.myapplication.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/** App-private storage and a deterministic mock photo-comparison endpoint. */
class AfterMealReviewRepository(context: Context) : ReviewRepository {
    private val appContext = context.applicationContext
    private val preferences = appContext.getSharedPreferences("after_meal_review", Context.MODE_PRIVATE)
    private val meals = MealCheckInRepository(appContext)

    override suspend fun savedMeals(): Result<List<SavedMeal>> = meals.savedMeals()
    override suspend fun savedMeal(id: String): Result<SavedMeal?> = meals.savedMeal(id)
    override suspend fun updateSavedFoods(id: String, foods: List<MealFood>): Result<Unit> = meals.updateSavedFoods(id, foods)
    override suspend fun importPhoto(uri: Uri): Result<String> = meals.importPhoto(uri)
    override suspend fun saveCameraPhoto(bitmap: Bitmap): Result<String> = meals.saveCameraPhoto(bitmap)

    override suspend fun loadDraft(mealId: String): Result<AfterMealReviewDraft> = withContext(Dispatchers.IO) {
        runCatching {
            val raw = preferences.getString("draft_$mealId", null)
            if (raw == null) AfterMealReviewDraft(mealId) else decodeDraft(JSONObject(raw), mealId)
        }
    }

    override suspend fun saveDraft(draft: AfterMealReviewDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching { check(preferences.edit().putString("draft_${draft.mealId}", encodeDraft(draft).toString()).commit()) }
    }

    override suspend fun comparePhotos(meal: SavedMeal, afterPhotoPath: String): Result<Map<String, FoodOutcome>> = withContext(Dispatchers.IO) {
        try { Result.success(run {
            require(meal.details.photoPath.isUsablePhoto() && afterPhotoPath.isUsablePhoto()) { "Photo is unavailable" }
            delay(1_400)
            // Mock API output is only a suggestion. Caregiver answers are stored separately.
            buildMap {
                meal.details.foods.forEachIndexed { index, food ->
                    put(foodOutcomeKey(food.id), if (index == 0) FoodOutcome.EATEN else FoodOutcome.UNTOUCHED)
                    food.ingredients.forEach { ingredient ->
                        put(ingredientOutcomeKey(food.id, ingredient), if (index == 0) FoodOutcome.TASTED else FoodOutcome.UNTOUCHED)
                    }
                }
            }
        }) } catch (cancelled: kotlinx.coroutines.CancellationException) { throw cancelled }
        catch (error: Exception) { Result.failure(error) }
    }

    override suspend fun savedSuggestions(mealId: String): Result<List<SavedSuggestion>> =
        RecommendationRepository(appContext).availableSaved(mealId)

    private fun String?.isUsablePhoto(): Boolean {
        val path = this ?: return false
        if (!File(path).isFile) return false
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, bounds)
        return bounds.outWidth > 0 && bounds.outHeight > 0
    }

    private fun encodeDraft(draft: AfterMealReviewDraft): JSONObject = JSONObject().apply {
        put("stage", draft.stage.name)
        put("afterPhotoPath", draft.afterPhotoPath)
        put("suggestions", JSONObject().apply { draft.suggestions.forEach { (key, value) -> put(key, value.name) } })
        put("answers", JSONObject().apply { draft.answers.forEach { (key, value) -> put(key, value.name) } })
        put("difficulties", JSONObject().apply {
            draft.difficulties.forEach { (foodId, tags) ->
                put(foodId, JSONArray().apply { tags.forEach { put(JSONObject().put("category", it.category).put("value", it.value).put("note", it.note)) } })
            }
        })
        put("exposureStep", draft.exposureStep)
        put("savedSuggestionAnswers", JSONObject().apply { draft.savedSuggestionAnswers.forEach { (id, tried) -> put(id, tried) } })
        put("completed", draft.completed)
        put("difficultyInputs", JSONObject().apply {
            draft.difficultyInputs.forEach { (id, input) -> put(id, JSONObject().put("category", input.category).put("value", input.value).put("note", input.note)) }
        })
    }

    private fun decodeDraft(json: JSONObject, mealId: String): AfterMealReviewDraft {
        fun outcomes(key: String): Map<String, FoodOutcome> {
            val objectValue = json.optJSONObject(key) ?: return emptyMap()
            return objectValue.keys().asSequence().mapNotNull { name ->
                runCatching { name to FoodOutcome.valueOf(objectValue.getString(name)) }.getOrNull()
            }.toMap()
        }
        val difficultyJson = json.optJSONObject("difficulties") ?: JSONObject()
        val difficulties = difficultyJson.keys().asSequence().associateWith { foodId ->
            val array = difficultyJson.optJSONArray(foodId) ?: JSONArray()
            List(array.length()) { index ->
                val tag = array.getJSONObject(index)
                DifficultyTag(tag.optString("category"), tag.optString("value"), tag.optString("note"))
            }
        }
        val savedAnswersJson = json.optJSONObject("savedSuggestionAnswers") ?: JSONObject()
        return AfterMealReviewDraft(
            mealId = mealId,
            stage = runCatching { ReviewStage.valueOf(json.optString("stage")) }.getOrDefault(ReviewStage.ADD_PHOTO),
            afterPhotoPath = json.optString("afterPhotoPath").takeIf(String::isNotBlank),
            suggestions = outcomes("suggestions"),
            answers = outcomes("answers"),
            difficulties = difficulties,
            exposureStep = json.optString("exposureStep").takeIf(String::isNotBlank),
            savedSuggestionAnswers = savedAnswersJson.keys().asSequence().associateWith(savedAnswersJson::getBoolean),
            completed = json.optBoolean("completed"),
            difficultyInputs = (json.optJSONObject("difficultyInputs") ?: JSONObject()).let { inputs ->
                inputs.keys().asSequence().associateWith { id -> inputs.getJSONObject(id).let { DifficultyInput(it.optString("category"), it.optString("value"), it.optString("note")) } }
            },
        )
    }
}
