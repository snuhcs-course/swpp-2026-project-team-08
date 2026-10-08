package com.mca.myapplication

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mca.myapplication.data.*
import com.mca.myapplication.ui.components.*
import com.mca.myapplication.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

sealed interface ReviewAction {
    data object Back : ReviewAction
    data object Exit : ReviewAction
    data object Retry : ReviewAction
    data object Camera : ReviewAction
    data object Gallery : ReviewAction
    data object Files : ReviewAction
    data object RemovePhoto : ReviewAction
    data object Compare : ReviewAction
    data object CancelComparison : ReviewAction
    data object Manual : ReviewAction
    data object ContinueOutcomes : ReviewAction
    data object AfterDifficulty : ReviewAction
    data object AfterGoal : ReviewAction
    data object Finish : ReviewAction
    data object OpenRecommendation : ReviewAction
    data class Stage(val stage: ReviewStage) : ReviewAction
    data class Dialog(val dialog: ReviewDialog) : ReviewAction
    data class FullPhoto(val path: String?) : ReviewAction
    data class Answer(val key: String, val outcome: FoodOutcome) : ReviewAction
    data class Edit(val food: MealFood?) : ReviewAction
    data class SaveFood(val food: MealFood) : ReviewAction
    data class Input(val id: String, val input: DifficultyInput) : ReviewAction
    data class AddTag(val id: String) : ReviewAction
    data class RemoveTag(val id: String, val tag: DifficultyTag) : ReviewAction
    data class Exposure(val step: String) : ReviewAction
    data class Suggestion(val tried: Boolean) : ReviewAction
}

@Composable
fun AfterMealReviewRoute(viewModel: AfterMealReviewViewModel, mealId: String?, onSelectMeal: (String) -> Unit, onExit: () -> Unit, onRecommendation: (String) -> Unit) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(mealId) { viewModel.open(mealId) }
    LaunchedEffect(state.exitReady) { if (state.exitReady) { viewModel.consumeExit(); onExit() } }
    DisposableEffect(viewModel) { onDispose { viewModel.cancelComparison() } }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { it?.let(viewModel::chooseCameraPhoto) }
    val gallery = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { it?.let(viewModel::choosePhoto) }
    val files = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { it?.let(viewModel::choosePhoto) }
    val onAction: (ReviewAction) -> Unit = { action ->
        when (action) {
            ReviewAction.Back -> viewModel.back()
            ReviewAction.Exit -> viewModel.exit()
            ReviewAction.Retry -> if (state.loadFailed) viewModel.open(mealId) else viewModel.retrySave()
            ReviewAction.Camera -> { viewModel.showDialog(ReviewDialog.NONE); runCatching { camera.launch(null) }.onFailure { viewModel.photoError() } }
            ReviewAction.Gallery -> { viewModel.showDialog(ReviewDialog.NONE); runCatching { gallery.launch("image/*") }.onFailure { viewModel.photoError() } }
            ReviewAction.Files -> { viewModel.showDialog(ReviewDialog.NONE); runCatching { files.launch(arrayOf("image/*")) }.onFailure { viewModel.photoError() } }
            ReviewAction.RemovePhoto -> viewModel.removePhoto()
            ReviewAction.Compare -> viewModel.compare()
            ReviewAction.CancelComparison -> viewModel.cancelComparison()
            ReviewAction.Manual -> viewModel.manual()
            ReviewAction.ContinueOutcomes -> viewModel.continueOutcomes()
            ReviewAction.AfterDifficulty -> viewModel.afterDifficulty()
            ReviewAction.AfterGoal -> viewModel.afterGoal()
            ReviewAction.Finish -> viewModel.finish()
            ReviewAction.OpenRecommendation -> state.meal?.id?.let(onRecommendation)
            is ReviewAction.Stage -> viewModel.transition(action.stage)
            is ReviewAction.Dialog -> viewModel.showDialog(action.dialog)
            is ReviewAction.FullPhoto -> viewModel.fullPhoto(action.path)
            is ReviewAction.Answer -> viewModel.answer(action.key, action.outcome)
            is ReviewAction.Edit -> viewModel.editFood(action.food)
            is ReviewAction.SaveFood -> viewModel.saveFood(action.food)
            is ReviewAction.Input -> viewModel.input(action.id, action.input)
            is ReviewAction.AddTag -> viewModel.addDifficulty(action.id)
            is ReviewAction.RemoveTag -> viewModel.removeDifficulty(action.id, action.tag)
            is ReviewAction.Exposure -> viewModel.exposure(action.step)
            is ReviewAction.Suggestion -> viewModel.suggestion(action.tried)
        }
    }
    BackHandler { viewModel.back() }
    AfterMealReviewScreen(state, onAction, onSelectMeal)
}

@Composable
fun AfterMealReviewScreen(state: AfterMealReviewUiState, onAction: (ReviewAction) -> Unit, onSelectMeal: (String) -> Unit) {
    MaterialTheme(colorScheme = MaterialTheme.colorScheme.copy(primary = MealBlue, onPrimary = Color.White, secondary = ReviewColors.Selected)) {
        AfterMealReviewContent(state, onAction, onSelectMeal)
    }
}

@Composable
private fun AfterMealReviewContent(state: AfterMealReviewUiState, onAction: (ReviewAction) -> Unit, onSelectMeal: (String) -> Unit) {
    val s = AfterMealReviewTexts.current
    val b = MealCheckInTexts.current
    if (state.fullPhoto != null) {
        Column(Modifier.fillMaxSize().background(ReviewColors.Canvas).safeDrawingPadding()) {
            TextButton(onClick = { onAction(ReviewAction.FullPhoto(null)) }) { Text(b.goBack) }
            ReviewPhoto(state.fullPhoto, b.tapFullPhoto, Modifier.weight(1f).fillMaxWidth(), ContentScale.Fit)
        }
        return
    }
    val draft = state.draft
    val stage = draft?.stage
    val photoStage = stage in listOf(ReviewStage.ADD_PHOTO, ReviewStage.PREVIEW, ReviewStage.COMPARE) && !state.comparing && !state.comparisonFailed
    val title = when {
        state.comparing -> s.comparing
        state.comparisonFailed -> s.compareFailed
        else -> when (stage) {
            null -> s.selectMeal
            ReviewStage.ADD_PHOTO -> s.afterPhoto
            ReviewStage.PREVIEW -> b.checkPhoto
            ReviewStage.COMPARE -> s.compare
            ReviewStage.OUTCOMES -> s.outcomes
            ReviewStage.DIFFICULTY -> s.difficulty
            ReviewStage.EXPOSURE_GOAL -> s.goal
            ReviewStage.EXPOSURE_RECORD -> s.record
            ReviewStage.SUGGESTIONS -> s.savedSuggestions
            ReviewStage.DONE -> s.done
        }
    }
    Column(Modifier.fillMaxSize().background(if (photoStage) MealCanvas else ReviewColors.Canvas).safeDrawingPadding().imePadding()) {
        Column(Modifier.padding(horizontal = if (photoStage) 24.dp else 18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
                IconButton(onClick = { onAction(ReviewAction.Back) }, enabled = !state.transitioning) { Surface(color = Color.White, shape = CircleShape, border = BorderStroke(1.dp, ReviewColors.Border), modifier = Modifier.size(36.dp)) { Box(contentAlignment = Alignment.Center) { FigmaIcon(R.drawable.ic_figma_back, size = 18.dp, description = b.goBack, tint = ReviewColors.Ink) } } }
                if (photoStage) Text(title, fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = MealNavy, modifier = Modifier.weight(1f))
                else Spacer(Modifier.weight(1f))
                if (stage == ReviewStage.DIFFICULTY) Text(b.optional, fontSize = 10.sp, color = ReviewColors.Muted)
                if (draft != null && stage != ReviewStage.DONE) IconButton(onClick = { onAction(ReviewAction.Exit) }, enabled = !state.transitioning && !state.importing) { FigmaIcon(R.drawable.ic_figma_save, description = s.exit, size = 18.dp) }
            }
            if (!photoStage) Text(title, fontSize = 20.sp, lineHeight = 24.sp, fontWeight = FontWeight.Bold, color = ReviewColors.Ink, modifier = Modifier.padding(top = 4.dp))
            if (photoStage && state.meal != null) Text(listOf(state.meal.childName, state.meal.details.date).filter { it.isNotBlank() }.joinToString(" · "), color = MealMuted, fontSize = 10.sp)
            if (stage == ReviewStage.OUTCOMES) Text(if (draft.suggestions.isEmpty()) s.manualHint else s.outcomeHint, color = ReviewColors.Muted, fontSize = 11.sp, lineHeight = 15.sp, modifier = Modifier.padding(top = 4.dp))
            if (stage == ReviewStage.DIFFICULTY) Text(s.difficultyHint, color = ReviewColors.Muted, fontSize = 10.sp, modifier = Modifier.padding(top = 4.dp))
            if (photoStage) Row(Modifier.padding(top = 12.dp, bottom = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                val progress = when (stage) { ReviewStage.ADD_PHOTO -> 1; ReviewStage.PREVIEW -> 2; else -> 4 }
                repeat(5) { Box(Modifier.weight(1f).height(4.dp).background(if (it < progress) MealBlue else MealBorder, CircleShape)) }
            }
        }
        if (state.loading) {
            Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else if (state.loadFailed) {
            Column(Modifier.weight(1f).padding(24.dp)) { Text(s.loadError); TextButton(onClick = { onAction(ReviewAction.Retry) }) { Text(s.retry) } }
        } else {
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = if (photoStage) 24.dp else 18.dp, vertical = 14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (draft == null) {
                    if (state.meals.isEmpty()) Text(s.emptyMeals, color = MealMuted)
                    state.meals.forEach { meal ->
                        Surface(onClick = { onSelectMeal(meal.id) }, shape = RoundedCornerShape(16.dp), color = Color.White, border = BorderStroke(1.dp, ReviewColors.Border)) {
                            Column(Modifier.fillMaxWidth().padding(16.dp)) {
                                Text(listOf(meal.childName, meal.details.date).filter { it.isNotBlank() }.joinToString(" · "), color = ReviewColors.Ink, fontWeight = FontWeight.Bold)
                                Text(meal.details.foods.joinToString { it.name }, color = ReviewColors.Muted, fontSize = 12.sp)
                            }
                        }
                    }
                } else when {
                    state.comparing -> {
                        Text(s.comparingDetail, fontSize = 12.sp, color = ReviewColors.Muted)
                        LinearProgressIndicator(Modifier.fillMaxWidth())
                        Text("${state.elapsedSeconds} ${s.seconds}", color = ReviewColors.Muted, fontSize = 11.sp)
                        Box(contentAlignment = Alignment.Center) {
                            ReviewPhoto(draft.afterPhotoPath, s.after, Modifier.fillMaxWidth().height(280.dp).clip(RoundedCornerShape(16.dp)))
                            Surface(color = Color.White.copy(alpha = .94f), shape = RoundedCornerShape(18.dp)) {
                                Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator(); Text(s.comparing, Modifier.padding(top = 14.dp)) }
                            }
                        }
                    }
                    state.comparisonFailed -> {
                        ComparisonPhotos(state, onAction)
                        Surface(color = MealDestructiveSoft, shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(16.dp)) { Text(s.analysisFailed, fontWeight = FontWeight.Bold); Text(s.photosSafe, fontSize = 12.sp) } }
                    }
                    else -> when (stage) {
                        ReviewStage.ADD_PHOTO -> {
                            Surface(color = MealNavy, shape = RoundedCornerShape(20.dp)) {
                                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text(s.addPhoto, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                                    Text(b.wholePlate, color = Color.White, fontSize = 11.sp)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Image(painterResource(R.drawable.meal_example_photo), b.wholePlate, Modifier.size(112.dp).clip(RoundedCornerShape(18.dp)), contentScale = ContentScale.Crop)
                                        Column(Modifier.padding(start = 12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                            listOf(b.goodLight, b.centeredPlate, b.visibleFood).forEachIndexed { i, text -> Row(verticalAlignment = Alignment.CenterVertically) {
                                                FigmaIcon(listOf(R.drawable.ic_figma_camera, R.drawable.ic_figma_gallery, R.drawable.ic_figma_file_image)[i], size = 14.dp, tint = Color.White)
                                                Text(text, color = Color.White, fontSize = 10.sp, lineHeight = 13.sp, modifier = Modifier.padding(start = 8.dp))
                                            } }
                                        }
                                    }
                                }
                            }
                            PhotoSources(onAction)
                            if (draft.afterPhotoPath != null) TextButton(onClick = { onAction(ReviewAction.Stage(ReviewStage.PREVIEW)) }) { Text(b.usePhoto) }
                        }
                        ReviewStage.PREVIEW -> {
                            Text(s.afterPhoto, color = MealNavy, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                            ReviewPhoto(draft.afterPhotoPath, s.afterPhoto, Modifier.fillMaxWidth().height(318.dp).clip(RoundedCornerShape(14.dp)).clickable { onAction(ReviewAction.FullPhoto(draft.afterPhotoPath)) }, ContentScale.Fit)
                            TextButton(onClick = { onAction(ReviewAction.FullPhoto(draft.afterPhotoPath)) }, modifier = Modifier.fillMaxWidth()) { FigmaIcon(R.drawable.ic_figma_expand, size = 15.dp); Text(b.tapFullPhoto, fontSize = 11.sp) }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                MealSecondaryButton(b.replacePhoto, { onAction(ReviewAction.Dialog(ReviewDialog.PHOTO_SOURCES)) }, Modifier.weight(1f), leadingIcon = R.drawable.ic_figma_refresh)
                                MealSecondaryButton(b.removePhoto, { onAction(ReviewAction.RemovePhoto) }, Modifier.weight(1f), destructive = true, leadingIcon = R.drawable.ic_figma_trash)
                            }
                            ReviewNotice(b.localPhotoNotice)
                        }
                        ReviewStage.COMPARE -> {
                            ComparisonPhotos(state, onAction)
                            ReviewNotice(s.photoConsent)
                            TextButton(onClick = { onAction(ReviewAction.Dialog(ReviewDialog.PHOTO_USE)) }) { Text(s.photoUse, fontSize = 11.sp) }
                            TextButton(onClick = { onAction(ReviewAction.Stage(ReviewStage.PREVIEW)) }) { Text(b.replacePhoto) }
                        }
                        ReviewStage.OUTCOMES -> OutcomeContent(state, onAction)
                        ReviewStage.DIFFICULTY -> state.meal?.details?.foods.orEmpty().forEach { DifficultyRow(it, draft, onAction) }
                        ReviewStage.EXPOSURE_GOAL, ReviewStage.EXPOSURE_RECORD -> {
                            val food = state.meal?.details?.let { meal -> meal.foods.firstOrNull { it.id == meal.exposureFoodId } }
                            if (food != null) {
                                Surface(color = Color.White, shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, ReviewColors.Border)) {
                                    Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                                        Surface(color = ReviewColors.GoalSoft, shape = CircleShape, modifier = Modifier.size(48.dp)) { Box(contentAlignment = Alignment.Center) { Image(painterResource(R.drawable.review_goal_icon), null, Modifier.size(23.dp)) } }
                                        Column { Text(food.name, color = ReviewColors.Ink, fontWeight = FontWeight.Bold); Text(s.goalLabel(food.exposureGoal).ifBlank { s.noStep }, color = ReviewColors.Ink) }
                                    }
                                }
                                if (stage == ReviewStage.EXPOSURE_RECORD) {
                                    Text(s.recordHint, color = ReviewColors.Muted, fontSize = 12.sp)
                                    b.exposureStepLabels.forEachIndexed { index, label ->
                                        FilterChip(selected = draft.exposureStep == index.toString(), onClick = { onAction(ReviewAction.Exposure(index.toString())) }, label = { Text(label) })
                                    }
                                }
                            }
                        }
                        ReviewStage.SUGGESTIONS -> SuggestionDeck(state, onAction)
                        ReviewStage.DONE -> { FigmaIcon(R.drawable.ic_figma_cloud_check, size = 40.dp, tint = MealParentInk); Text(s.done, color = ReviewColors.Muted) }
                        null -> Unit
                    }
                }
                if (state.importing) CircularProgressIndicator()
                if (state.photoFailed) Text(b.photoError, color = MealDestructiveInk)
            }
        }
        if (draft != null && !state.loading && !state.loadFailed) {
            Column(Modifier.fillMaxWidth().padding(horizontal = if (photoStage) 24.dp else 18.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                val enabled = !state.transitioning && !state.importing
                when {
                    state.comparing -> ReviewButton(s.cancelSafely, { onAction(ReviewAction.CancelComparison) }, secondary = true)
                    state.comparisonFailed -> { ReviewButton(s.retryComparison, { onAction(ReviewAction.Compare) }, enabled); ReviewButton(s.manual, { onAction(ReviewAction.Manual) }, enabled, secondary = true) }
                    else -> when (stage) {
                        ReviewStage.PREVIEW -> ReviewButton(b.usePhoto, { onAction(ReviewAction.Stage(ReviewStage.COMPARE)) }, enabled && draft.afterPhotoPath != null, photo = true)
                        ReviewStage.COMPARE -> { ReviewButton(s.compareAI, { onAction(ReviewAction.Compare) }, enabled, photo = true); ReviewButton(s.manual, { onAction(ReviewAction.Manual) }, enabled, secondary = true, photo = true) }
                        ReviewStage.OUTCOMES -> ReviewButton(s.continueLabel, { onAction(ReviewAction.ContinueOutcomes) }, enabled, dark = true)
                        ReviewStage.DIFFICULTY -> { ReviewButton(s.continueLabel, { onAction(ReviewAction.AfterDifficulty) }, enabled); ReviewButton(s.skip, { onAction(ReviewAction.AfterDifficulty) }, enabled, secondary = true) }
                        ReviewStage.EXPOSURE_GOAL -> { ReviewButton(s.record, { onAction(ReviewAction.Stage(ReviewStage.EXPOSURE_RECORD)) }, enabled); ReviewButton(s.skip, { onAction(ReviewAction.AfterGoal) }, enabled, secondary = true) }
                        ReviewStage.EXPOSURE_RECORD -> { ReviewButton(s.continueLabel, { onAction(ReviewAction.AfterGoal) }, enabled && draft.exposureStep != null); ReviewButton(s.skip, { onAction(ReviewAction.AfterGoal) }, enabled, secondary = true) }
                        ReviewStage.SUGGESTIONS -> if (state.suggestionIndex >= state.savedSuggestions.size) ReviewButton(s.finish, { onAction(ReviewAction.Finish) }, enabled)
                        ReviewStage.DONE -> { ReviewButton(RecommendationTexts.current.title, { onAction(ReviewAction.OpenRecommendation) }, enabled); ReviewButton(s.home, { onAction(ReviewAction.Exit) }, enabled, secondary = true); TextButton(onClick = { onAction(ReviewAction.Stage(ReviewStage.OUTCOMES)) }) { Text(s.editAgain) } }
                        else -> Unit
                    }
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    Text(if (state.saveFailed) b.saveError else if (state.saving) b.saving else b.savedDraft, color = if (state.saveFailed) MealDestructiveInk else MealMuted, fontSize = 9.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                    if (state.saveFailed) TextButton(onClick = { onAction(ReviewAction.Retry) }) { Text(s.retry) }
                }
            }
        }
    }
    if (state.editingFood != null) FoodEditorSheet(state.editingFood, { onAction(ReviewAction.Edit(null)) }, { onAction(ReviewAction.SaveFood(it)) }, saveFailed = state.saveFailed, isSaving = state.transitioning)
    if (state.dialog != ReviewDialog.NONE) AlertDialog(
        onDismissRequest = { onAction(ReviewAction.Dialog(ReviewDialog.NONE)) },
        title = { Text(when (state.dialog) { ReviewDialog.DEFINITIONS -> s.definitions; ReviewDialog.PHOTO_USE -> s.photoUse; else -> b.replacePhoto }) },
        text = { Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            when (state.dialog) {
                ReviewDialog.DEFINITIONS -> { FoodOutcome.entries.forEach { Text("${s.outcome(it)}: ${s.definition(it)}", fontSize = 12.sp) }; Text("${s.unanswered}: ${s.definitionNote}", fontSize = 12.sp, color = MealDestructiveInk) }
                ReviewDialog.PHOTO_USE -> Text(s.photoDetails)
                ReviewDialog.PHOTO_SOURCES -> PhotoSources(onAction)
                else -> Unit
            }
        } },
        confirmButton = { TextButton(onClick = { onAction(ReviewAction.Dialog(ReviewDialog.NONE)) }) { Text(s.gotIt) } },
    )
}

@Composable
private fun PhotoSources(onAction: (ReviewAction) -> Unit) {
    val b = MealCheckInTexts.current
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ChoiceAction(b.takePhoto, R.drawable.ic_figma_camera, { onAction(ReviewAction.Camera) })
        ChoiceAction(b.gallery, R.drawable.ic_figma_gallery, { onAction(ReviewAction.Gallery) })
        ChoiceAction(b.files, R.drawable.ic_figma_file_image, { onAction(ReviewAction.Files) }, detail = b.supportedImages)
    }
}

@Composable
private fun ReviewPhoto(path: String?, label: String, modifier: Modifier, scale: ContentScale = ContentScale.Crop) {
    val s = AfterMealReviewTexts.current
    var loaded by remember(path) { mutableStateOf(false) }
    val bitmap by produceState<Bitmap?>(null, path) {
        value = withContext(Dispatchers.IO) { path?.let {
            runCatching {
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }; BitmapFactory.decodeFile(it, bounds)
                var sample = 1
                while (bounds.outWidth / sample > 1600 || bounds.outHeight / sample > 1600) sample *= 2
                BitmapFactory.decodeFile(it, BitmapFactory.Options().apply { inSampleSize = sample })
            }.getOrNull()
        } }
        loaded = true
    }
    Box(modifier.background(MealSoftBlue), contentAlignment = Alignment.Center) {
        if (bitmap != null) Image(bitmap!!.asImageBitmap(), label, Modifier.fillMaxSize(), contentScale = scale)
        else if (!loaded) CircularProgressIndicator(Modifier.size(24.dp))
        else Text(s.photoUnavailable, color = MealMuted, fontSize = 11.sp, modifier = Modifier.padding(12.dp))
    }
}

@Composable
private fun ComparisonPhotos(state: AfterMealReviewUiState, onAction: (ReviewAction) -> Unit) {
    val s = AfterMealReviewTexts.current
    val b = MealCheckInTexts.current
    Surface(color = Color.White, shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, MealBorder)) {
        Column {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(s.before to state.meal?.details?.photoPath, s.after to state.draft?.afterPhotoPath).forEach { (label, path) ->
                    Column(Modifier.weight(1f)) {
                        Box {
                            ReviewPhoto(path, label, Modifier.fillMaxWidth().height(230.dp).clip(RoundedCornerShape(12.dp)).clickable(enabled = path != null) { onAction(ReviewAction.FullPhoto(path)) }, ContentScale.Fit)
                            Surface(color = Color.White.copy(alpha = .9f), shape = CircleShape, modifier = Modifier.padding(8.dp)) { Text(label, color = ReviewColors.Selected, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(6.dp)) }
                        }
                        TextButton(onClick = { onAction(ReviewAction.FullPhoto(path)) }, enabled = path != null) { FigmaIcon(R.drawable.ic_figma_expand, size = 15.dp); Text(b.tapFullPhoto, fontSize = 9.sp) }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReviewNotice(text: String) { Surface(color = MealSoftBlue, shape = RoundedCornerShape(12.dp)) { Text(text, color = MealNavy, fontSize = 11.sp, lineHeight = 16.sp, modifier = Modifier.padding(12.dp)) } }

@Composable
private fun ReviewButton(label: String, onClick: () -> Unit, enabled: Boolean = true, secondary: Boolean = false, dark: Boolean = false, photo: Boolean = false) {
    Button(onClick, Modifier.fillMaxWidth().heightIn(min = 48.dp), enabled = enabled, shape = if (photo) RoundedCornerShape(14.dp) else CircleShape,
        colors = ButtonDefaults.buttonColors(containerColor = if (secondary) Color.White else if (dark) ReviewColors.Selected else MealBlue, contentColor = if (secondary) ReviewColors.Ink else Color.White),
        border = if (secondary) BorderStroke(1.dp, ReviewColors.Border) else null) { Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
}

@Composable
private fun OutcomeContent(state: AfterMealReviewUiState, onAction: (ReviewAction) -> Unit) {
    val s = AfterMealReviewTexts.current
    val b = MealCheckInTexts.current
    val draft = state.draft ?: return
    val foods = state.meal?.details?.foods.orEmpty()
    if (draft.suggestions.isNotEmpty()) StatusPill(b.aiSuggestion, MealAiSoft, MealAiInk)
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text("${foods.size} ${s.foodItems}", color = ReviewColors.Ink, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
        IconButton(onClick = { onAction(ReviewAction.Dialog(ReviewDialog.DEFINITIONS)) }) { FigmaIcon(R.drawable.ic_figma_help, description = s.definitions, size = 16.dp, tint = MealBlue) }
    }
    if (state.missing.isNotEmpty()) Text(s.missing, color = MealDestructiveInk, fontSize = 12.sp)
    if (state.noFoods) Text(s.noFoods, color = MealDestructiveInk, fontSize = 12.sp)
    foods.forEach { food ->
        Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(bottom = 8.dp)) {
            Text(food.name, color = ReviewColors.Ink, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            OutcomeRow(foodOutcomeKey(food.id), draft, state.missing, onAction, enabled = !state.transitioning)
            food.ingredients.distinct().forEach { ingredient ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(start = 8.dp)) {
                    Text(ingredient, color = ReviewColors.Ink, fontSize = 10.sp, modifier = Modifier.width(66.dp).padding(end = 6.dp))
                    OutcomeRow(ingredientOutcomeKey(food.id, ingredient), draft, state.missing, onAction, Modifier.weight(1f), !state.transitioning)
                }
            }
            TextButton(onClick = { onAction(ReviewAction.Edit(food)) }, enabled = !state.transitioning, modifier = Modifier.align(Alignment.End)) { Text(s.editInfo, fontSize = 10.sp) }
        }
    }
    TextButton(onClick = { onAction(ReviewAction.Edit(MealFood(name = ""))) }, enabled = !state.transitioning) { Text(b.addFood) }
}

@Composable
private fun OutcomeRow(key: String, draft: AfterMealReviewDraft, missing: Set<String>, onAction: (ReviewAction) -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    val s = AfterMealReviewTexts.current
    Column(modifier) {
        Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
            FoodOutcome.entries.forEach { outcome ->
                val selected = draft.answers[key] == outcome
                val suggested = draft.suggestions[key] == outcome && draft.answers[key] == null
                Surface(onClick = { onAction(ReviewAction.Answer(key, outcome)) }, enabled = enabled,
                    color = if (selected) ReviewColors.Selected else if (suggested) MealAiSoft else Color.White,
                    shape = RoundedCornerShape(8.dp), border = BorderStroke(1.dp, if (suggested) MealAiInk else if (key in missing) MealDestructiveInk else ReviewColors.Border),
                    modifier = Modifier.weight(1f).fillMaxHeight().heightIn(min = 42.dp).semantics { this.selected = selected; stateDescription = if (selected) s.confirmed else if (suggested) s.suggested else s.unanswered }) {
                    Column(Modifier.padding(horizontal = 2.dp, vertical = 7.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        Text(s.outcome(outcome), fontSize = 9.sp, lineHeight = 11.sp, color = if (selected) Color.White else ReviewColors.Ink, textAlign = TextAlign.Center)
                        if (suggested) Text(s.suggested, fontSize = 7.sp, color = MealAiInk)
                    }
                }
            }
        }
        if (key in missing) Text(s.unanswered, fontSize = 9.sp, color = MealDestructiveInk)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DifficultyRow(food: MealFood, draft: AfterMealReviewDraft, onAction: (ReviewAction) -> Unit) {
    val s = AfterMealReviewTexts.current
    val input = draft.difficultyInputs[food.id] ?: DifficultyInput()
    Column(verticalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.padding(bottom = 10.dp)) {
        Text(food.name, color = ReviewColors.Ink, fontWeight = FontWeight.Bold, fontSize = 11.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            ReviewDropdown(input.category, s.category, reviewDifficultyCategories.map { it.key }, { category ->
                onAction(ReviewAction.Input(food.id, DifficultyInput(category, if (category == "Not sure") "Not sure" else "")))
            }, Modifier.weight(1.6f), categoryIcons = true)
            ReviewDropdown(input.value, s.value, reviewDifficultyCategories.firstOrNull { it.key == input.category }?.options.orEmpty(), { value ->
                onAction(ReviewAction.Input(food.id, input.copy(value = value, note = "")))
            }, Modifier.weight(1f), colorDots = input.category == "Color")
            Button(onClick = { onAction(ReviewAction.AddTag(food.id)) }, enabled = input.toTag() != null, shape = RoundedCornerShape(12.dp), contentPadding = PaddingValues(horizontal = 10.dp), modifier = Modifier.width(68.dp).heightIn(min = 42.dp), colors = ButtonDefaults.buttonColors(containerColor = MealBlue)) { Text(s.add, fontSize = 10.sp) }
        }
        if (input.value in listOf("Other", "Others", "Optional note") || (input.category == "Shape and size" && input.value == "Not sure")) {
            OutlinedTextField(input.note, { onAction(ReviewAction.Input(food.id, input.copy(note = it))) }, modifier = Modifier.fillMaxWidth(), placeholder = { Text(s.custom, fontSize = 11.sp) }, shape = RoundedCornerShape(12.dp), minLines = 1, maxLines = 4)
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            draft.difficulties[food.id].orEmpty().forEach { tag ->
                Surface(color = MealParentSoft, shape = CircleShape, border = BorderStroke(1.dp, MealParentInk.copy(alpha = .25f))) {
                    Row(Modifier.widthIn(max = 330.dp).padding(start = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                        if (tag.category == "Color") ReviewColors.colors[tag.value]?.let { Box(Modifier.size(12.dp).background(it, CircleShape)); Spacer(Modifier.width(5.dp)) }
                        Text("${s.option(tag.category)}: ${s.option(tag.value)}${if (tag.note.isNotBlank()) " · ${tag.note}" else ""}", color = MealParentInk, fontSize = 10.sp, modifier = Modifier.weight(1f, fill = false))
                        IconButton(onClick = { onAction(ReviewAction.RemoveTag(food.id, tag)) }, modifier = Modifier.size(36.dp)) { FigmaIcon(R.drawable.ic_figma_close, description = "${MealCheckInTexts.current.removeFood} ${s.option(tag.value)}", size = 10.dp, tint = MealParentInk) }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReviewDropdown(selected: String, placeholder: String, options: List<String>, onSelect: (String) -> Unit, modifier: Modifier, colorDots: Boolean = false, categoryIcons: Boolean = false) {
    val s = AfterMealReviewTexts.current
    var expanded by remember { mutableStateOf(false) }
    Box(modifier) {
        Surface(onClick = { expanded = true }, enabled = options.isNotEmpty(), shape = RoundedCornerShape(12.dp), color = Color.White, border = BorderStroke(1.dp, ReviewColors.Border)) {
            Row(Modifier.fillMaxWidth().heightIn(min = 42.dp).padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(if (selected.isBlank()) placeholder else s.option(selected), color = ReviewColors.Ink, fontSize = 10.sp, lineHeight = 13.sp, modifier = Modifier.weight(1f))
                FigmaIcon(R.drawable.ic_figma_chevron_down, size = 14.dp, tint = ReviewColors.Ink)
            }
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }, modifier = Modifier.widthIn(min = 145.dp, max = 220.dp).heightIn(max = 330.dp), containerColor = Color.White) {
            options.forEach { value ->
                DropdownMenuItem(text = { Text(s.option(value), fontSize = 11.sp) }, onClick = { expanded = false; onSelect(value) },
                    leadingIcon = if (colorDots || categoryIcons) ({
                        if (colorDots) ReviewColors.colors[value]?.let { Box(Modifier.size(12.dp).background(it, CircleShape).border(1.dp, ReviewColors.Border, CircleShape)) }
                        else FigmaIcon(R.drawable.ic_figma_utensils, size = 12.dp, tint = ReviewColors.Ink)
                    }) else null,
                    trailingIcon = if (selected == value) ({ FigmaIcon(R.drawable.ic_figma_check, size = 12.dp) }) else null)
            }
        }
    }
}

@Composable
private fun SuggestionDeck(state: AfterMealReviewUiState, onAction: (ReviewAction) -> Unit) {
    val s = AfterMealReviewTexts.current
    val card = state.savedSuggestions.getOrNull(state.suggestionIndex)
    Text("${s.swipe} ${state.savedSuggestions.size} ${s.cards}", color = ReviewColors.Muted, fontSize = 11.sp)
    TextButton(onClick = { onAction(ReviewAction.Back) }) { Text(MealCheckInTexts.current.goBack) }
    if (card == null) return
    Box(Modifier.fillMaxWidth().padding(vertical = 12.dp)) {
        repeat(minOf(2, state.savedSuggestions.size - state.suggestionIndex - 1)) { index ->
            Surface(color = MealSoftBlue, shape = RoundedCornerShape(22.dp), border = BorderStroke(1.dp, ReviewColors.Border), modifier = Modifier.fillMaxWidth().height(350.dp).rotate(if (index == 0) -3f else 3f)) {}
        }
        Surface(color = Color.White, shape = RoundedCornerShape(22.dp), border = BorderStroke(1.dp, ReviewColors.Border), modifier = Modifier.fillMaxWidth().heightIn(min = 350.dp).pointerInput(card.id) {
            var drag = 0f
            detectHorizontalDragGestures(onDragStart = { drag = 0f }, onHorizontalDrag = { change, amount -> change.consume(); drag += amount }, onDragCancel = { drag = 0f }, onDragEnd = {
                if (kotlin.math.abs(drag) > 80.dp.toPx()) onAction(ReviewAction.Suggestion(drag > 0))
            })
        }) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                StatusPill("${s.saved} ${state.suggestionIndex + 1}", MealSoftBlue, ReviewColors.Selected)
                Text(s.what, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ReviewColors.Selected)
                Text(RecommendationTexts.current.title(card), fontSize = 23.sp, lineHeight = 28.sp, fontWeight = FontWeight.Bold, color = ReviewColors.Ink)
                Text(s.why, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ReviewColors.Selected)
                Text(RecommendationTexts.current.reason(card), fontSize = 13.sp, color = ReviewColors.Muted)
                Text(s.servingTip, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ReviewColors.Selected)
                Text(RecommendationTexts.current.tip(card), fontSize = 13.sp, color = ReviewColors.Muted)
            }
        }
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
        FilledTonalIconButton(onClick = { onAction(ReviewAction.Suggestion(false)) }, modifier = Modifier.size(56.dp)) { FigmaIcon(R.drawable.ic_figma_close, description = s.no, size = 22.dp, tint = MealAiInk) }
        FilledIconButton(onClick = { onAction(ReviewAction.Suggestion(true)) }, modifier = Modifier.size(56.dp)) { FigmaIcon(R.drawable.ic_figma_check, description = s.yes, size = 22.dp, tint = Color.White) }
    }
}
