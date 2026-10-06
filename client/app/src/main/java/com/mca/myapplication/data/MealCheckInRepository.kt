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
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Local persistence plus mock endpoints for the Meal Check-in prototype. */
class MealCheckInRepository(context: Context) {
    private val appContext = context.applicationContext
    private val preferences = appContext.getSharedPreferences("meal_checkin", Context.MODE_PRIVATE)

    suspend fun loadDraft(): Result<MealCheckInDraft?> = withContext(Dispatchers.IO) {
        runCatching { preferences.getString(DRAFT_KEY, null)?.let(::decodeDraft) }
    }

    suspend fun saveDraft(draft: MealCheckInDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching { check(preferences.edit().putString(DRAFT_KEY, encodeDraft(draft)).commit()) }
    }

    suspend fun saveMeal(draft: MealCheckInDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val records = JSONArray(preferences.getString(RECORDS_KEY, "[]"))
            records.put(JSONObject(encodeDraft(draft)).put("savedAt", System.currentTimeMillis()))
            check(preferences.edit().putString(RECORDS_KEY, records.toString()).remove(DRAFT_KEY).commit())
        }
    }

    suspend fun importPhoto(uri: Uri): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val mime = appContext.contentResolver.getType(uri)
            require(mime?.startsWith("image/") == true) { "Unsupported image type" }
            val destination = File(appContext.filesDir, "meal_${System.currentTimeMillis()}.jpg")
            appContext.contentResolver.openInputStream(uri).use { input ->
                requireNotNull(input) { "Could not read selected image" }
                destination.outputStream().use(input::copyTo)
            }
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(destination.absolutePath, bounds)
            require(bounds.outWidth > 0 && bounds.outHeight > 0) { "Could not decode selected image" }
            destination.absolutePath
        }
    }

    suspend fun saveCameraPhoto(bitmap: Bitmap): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val destination = File(appContext.filesDir, "meal_${System.currentTimeMillis()}.jpg")
            FileOutputStream(destination).use { output ->
                check(bitmap.compress(Bitmap.CompressFormat.JPEG, 92, output))
            }
            destination.absolutePath
        }
    }

    /** Deterministic local stand-in for the photo analysis endpoint. */
    suspend fun analyzePhoto(photoPath: String, language: String): Result<List<MealFood>> = withContext(Dispatchers.IO) {
        runCatching {
            check(File(photoPath).exists()) { "Photo is no longer available" }
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(photoPath, bounds)
            check(bounds.outWidth >= 120 && bounds.outHeight >= 120) { "Photo resolution is too low to analyze" }
            delay(1_400)
            if (language == "ko") listOf(
                MealFood(name = "나선 파스타", ingredients = listOf("밀", "물"), presentation = "삶음", servingNote = "작은 나선 모양", traits = listOf("부드러움", "따뜻함"), history = "Usually accepted", source = FoodSource.AI),
                MealFood(name = "당근 스틱", ingredients = listOf("당근"), presentation = "구움", servingNote = "얇은 막대 모양", traits = listOf("주황색", "부드러움"), history = "Sometimes accepted", source = FoodSource.AI),
                MealFood(name = "오이 조각", ingredients = listOf("오이"), presentation = "생식", servingNote = "둥근 조각", traits = listOf("차가움", "아삭함"), history = "Usually accepted", source = FoodSource.AI),
            ) else listOf(
                MealFood(name = "Pasta spirals", ingredients = listOf("Wheat", "Water"), presentation = "Boiled", servingNote = "Small spirals", traits = listOf("Soft", "Warm"), history = "Usually accepted", source = FoodSource.AI),
                MealFood(name = "Carrot sticks", ingredients = listOf("Carrot"), presentation = "Roasted", servingNote = "Thin sticks", traits = listOf("Orange", "Soft"), history = "Sometimes accepted", source = FoodSource.AI),
                MealFood(name = "Cucumber slices", ingredients = listOf("Cucumber"), presentation = "Raw / unheated", servingNote = "Round slices", traits = listOf("Cool", "Crunchy / crisp"), history = "Usually accepted", source = FoodSource.AI),
            )
        }
    }

    private fun encodeDraft(draft: MealCheckInDraft): String = JSONObject().apply {
        put("stage", draft.stage)
        put("date", draft.date)
        put("mealType", draft.mealType)
        put("setting", draft.setting)
        put("photoPath", draft.photoPath)
        put("exposureFoodId", draft.exposureFoodId)
        put("foods", JSONArray().apply { draft.foods.forEach { put(encodeFood(it)) } })
    }.toString()

    private fun decodeDraft(raw: String): MealCheckInDraft {
        val json = JSONObject(raw)
        val foodsJson = json.optJSONArray("foods") ?: JSONArray()
        return MealCheckInDraft(
            stage = json.optInt("stage"),
            date = json.optString("date", today()),
            mealType = json.optString("mealType"),
            setting = json.optString("setting"),
            photoPath = json.optString("photoPath").takeIf(String::isNotBlank),
            exposureFoodId = json.optString("exposureFoodId").takeIf(String::isNotBlank),
            foods = List(foodsJson.length()) { index -> decodeFood(foodsJson.getJSONObject(index)) },
        )
    }

    private fun encodeFood(food: MealFood): JSONObject = JSONObject().apply {
        put("id", food.id)
        put("name", food.name)
        put("ingredients", JSONArray(food.ingredients))
        put("presentation", food.presentation)
        put("servingNote", food.servingNote)
        put("traits", JSONArray(food.traits))
        put("traitSelections", JSONObject().apply {
            food.traitSelections.forEach { (category, values) -> put(category, JSONArray(values)) }
        })
        put("history", food.history)
        put("exposureGoal", food.exposureGoal)
        put("source", food.source.name)
    }

    private fun decodeFood(json: JSONObject): MealFood {
        val traitSelectionsJson = json.optJSONObject("traitSelections") ?: JSONObject()
        val traitSelections = buildMap {
            traitSelectionsJson.keys().forEach { category -> put(category, traitSelectionsJson.optJSONArray(category).toStringList()) }
        }
        return MealFood(
        id = json.optString("id").ifBlank { java.util.UUID.randomUUID().toString() },
        name = json.optString("name"),
        ingredients = json.optJSONArray("ingredients").toStringList(),
        presentation = json.optString("presentation"),
        servingNote = json.optString("servingNote"),
        traits = json.optJSONArray("traits").toStringList(),
        traitSelections = traitSelections,
        history = json.optString("history"),
        exposureGoal = json.optString("exposureGoal"),
        source = runCatching { FoodSource.valueOf(json.optString("source")) }.getOrDefault(FoodSource.PARENT),
    )
    }

    private fun JSONArray?.toStringList(): List<String> = this?.let { array -> List(array.length()) { array.getString(it) } }.orEmpty()

    private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    private companion object {
        const val DRAFT_KEY = "draft_v1"
        const val RECORDS_KEY = "records_v1"
    }
}

enum class FoodSource { AI, PARENT }

data class MealFood(
    val id: String = java.util.UUID.randomUUID().toString(),
    val name: String,
    val ingredients: List<String> = emptyList(),
    val presentation: String = "",
    val servingNote: String = "",
    val traits: List<String> = emptyList(),
    val traitSelections: Map<String, List<String>> = emptyMap(),
    val history: String = "",
    val exposureGoal: String = "",
    val source: FoodSource = FoodSource.PARENT,
)

data class MealCheckInDraft(
    val stage: Int = 0,
    val date: String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()),
    val mealType: String = "",
    val setting: String = "",
    val photoPath: String? = null,
    val exposureFoodId: String? = null,
    val foods: List<MealFood> = emptyList(),
)

fun MealCheckInDraft.withParentReviewedFood(food: MealFood): MealCheckInDraft {
    val reviewed = food.copy(source = FoodSource.PARENT)
    val updatedFoods = if (foods.any { it.id == reviewed.id }) {
        foods.map { if (it.id == reviewed.id) reviewed else it }
    } else {
        foods + reviewed
    }
    return copy(foods = updatedFoods)
}

fun MealCheckInDraft.confirmedByParent(): MealCheckInDraft =
    copy(foods = foods.map { it.copy(source = FoodSource.PARENT) })
