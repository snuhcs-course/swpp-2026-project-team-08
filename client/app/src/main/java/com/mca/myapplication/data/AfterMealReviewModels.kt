package com.mca.myapplication.data

enum class FoodOutcome { EATEN, TASTED, UNTOUCHED, UNCLEAR }

enum class ReviewStage { ADD_PHOTO, PREVIEW, COMPARE, OUTCOMES, DIFFICULTY, EXPOSURE_GOAL, EXPOSURE_RECORD, SUGGESTIONS, DONE }

data class DifficultyTag(val category: String, val value: String, val note: String = "")
data class DifficultyInput(val category: String = "", val value: String = "", val note: String = "")

data class SavedSuggestion(val id: String, val title: String, val reason: String, val servingTip: String, val tried: Boolean? = null, val foodName: String = "", val kind: String = "")

data class AfterMealReviewDraft(
    val mealId: String,
    val stage: ReviewStage = ReviewStage.ADD_PHOTO,
    val afterPhotoPath: String? = null,
    val suggestions: Map<String, FoodOutcome> = emptyMap(),
    val answers: Map<String, FoodOutcome> = emptyMap(),
    val difficulties: Map<String, List<DifficultyTag>> = emptyMap(),
    val exposureStep: String? = null,
    val savedSuggestionAnswers: Map<String, Boolean> = emptyMap(),
    val completed: Boolean = false,
    val difficultyInputs: Map<String, DifficultyInput> = emptyMap(),
)

fun foodOutcomeKey(foodId: String): String = "food:$foodId"
fun ingredientOutcomeKey(foodId: String, ingredient: String): String =
    "ingredient:" + java.util.UUID.nameUUIDFromBytes("$foodId\u0000$ingredient".toByteArray(Charsets.UTF_8))

fun MealFood.outcomeKeys(): List<String> = listOf(foodOutcomeKey(id)) + ingredients.distinct().map { ingredientOutcomeKey(id, it) }

fun AfterMealReviewDraft.reconcile(foods: List<MealFood>): AfterMealReviewDraft {
    val keys = foods.flatMap { it.outcomeKeys() }.toSet()
    val ids = foods.map { it.id }.toSet()
    return copy(answers = answers.filterKeys { it in keys }, suggestions = suggestions.filterKeys { it in keys },
        difficulties = difficulties.filterKeys { it in ids }, difficultyInputs = difficultyInputs.filterKeys { it in ids })
}

fun AfterMealReviewDraft.missingAnswers(foods: List<MealFood>): Set<String> =
    foods.flatMap { it.outcomeKeys() }.filterNot { it in answers }.toSet()

data class DifficultyCategory(val key: String, val options: List<String>, val multiple: Boolean = false)
val reviewDifficultyCategories = listOf(
    DifficultyCategory("Texture", listOf("Smooth / creamy", "Soft / mushy", "Lumpy / chunky", "Crunchy / crisp", "Chewy / tough", "Wet / slippery", "Mixed textures", "Other"), true),
    DifficultyCategory("Taste type", listOf("Sweet", "Salty", "Sour", "Bitter", "Spicy / hot", "Other"), true),
    DifficultyCategory("Taste intensity", listOf("Mild", "Strong")),
    DifficultyCategory("Smell", listOf("Strong", "Mild", "No noticeable smell", "Not sure")),
    DifficultyCategory("Color", listOf("Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Brown", "Black", "White", "Gray", "Others"), true),
    DifficultyCategory("Shape and size", listOf("Consistent", "Varied", "Not sure", "Optional note"), true),
    DifficultyCategory("Ingredient visibility", listOf("Clearly visible", "Partly visible", "Blended / not separately visible", "Not sure")),
    DifficultyCategory("Temperature", listOf("Hot", "Warm", "Room temperature", "Cool / chilled", "Not sure")),
    DifficultyCategory("Not sure", listOf("Not sure")),
)

fun DifficultyInput.toTag(): DifficultyTag? {
    val definition = reviewDifficultyCategories.firstOrNull { it.key == category } ?: return null
    if (value !in definition.options) return null
    if (value in listOf("Other", "Others", "Optional note") && note.isBlank()) return null
    return DifficultyTag(category, value, note.trim())
}

fun List<DifficultyTag>.adding(tag: DifficultyTag): List<DifficultyTag> {
    val multiple = reviewDifficultyCategories.firstOrNull { it.key == tag.category }?.multiple ?: return this
    val retained = if (multiple) this else filterNot { it.category == tag.category }
    return (retained + tag).distinct()
}
