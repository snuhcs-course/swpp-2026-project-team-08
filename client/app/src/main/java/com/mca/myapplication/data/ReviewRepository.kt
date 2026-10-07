package com.mca.myapplication.data

import android.graphics.Bitmap
import android.net.Uri

interface ReviewRepository {
    suspend fun savedMeals(): Result<List<SavedMeal>>
    suspend fun savedMeal(id: String): Result<SavedMeal?>
    suspend fun updateSavedFoods(id: String, foods: List<MealFood>): Result<Unit>
    suspend fun importPhoto(uri: Uri): Result<String>
    suspend fun saveCameraPhoto(bitmap: Bitmap): Result<String>
    suspend fun loadDraft(mealId: String): Result<AfterMealReviewDraft>
    suspend fun saveDraft(draft: AfterMealReviewDraft): Result<Unit>
    suspend fun comparePhotos(meal: SavedMeal, afterPhotoPath: String): Result<Map<String, FoodOutcome>>
    suspend fun savedSuggestions(mealId: String): Result<List<SavedSuggestion>>
}
