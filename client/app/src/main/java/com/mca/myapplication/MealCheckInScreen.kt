package com.mca.myapplication

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.BackHandler
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mca.myapplication.data.FoodSource
import com.mca.myapplication.data.MealCheckInDraft
import com.mca.myapplication.data.MealFood
import com.mca.myapplication.ui.components.*
import com.mca.myapplication.ui.theme.MealBlue
import com.mca.myapplication.ui.theme.MealBorder
import com.mca.myapplication.ui.theme.MealCanvas
import com.mca.myapplication.ui.theme.MealMuted
import com.mca.myapplication.ui.theme.MealNavy
import com.mca.myapplication.ui.theme.MealSoftBlue
import com.mca.myapplication.ui.theme.MealAiSoft
import com.mca.myapplication.ui.theme.MealAiInk
import com.mca.myapplication.ui.theme.MealParentSoft
import com.mca.myapplication.ui.theme.MealParentInk
import com.mca.myapplication.ui.theme.MealDestructiveInk
import com.mca.myapplication.ui.theme.MealDestructiveBorder
import com.mca.myapplication.ui.theme.MealDestructiveSoft
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val MealTypes: List<Pair<String, String>>
    @Composable get() {
        val s = MealCheckInTexts.current
        return listOf("Breakfast" to s.breakfast, "Lunch" to s.lunch, "Dinner" to s.dinner, "Snack" to s.snack)
    }

private val MealSettings: List<Pair<String, String>>
    @Composable get() {
        val s = MealCheckInTexts.current
        return listOf("Home" to s.homeSetting, "Restaurant" to s.restaurant, "School" to s.school, "Others" to s.others)
    }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MealCheckInScreen(viewModel: MealCheckInViewModel, onExit: () -> Unit, onOpenReview: (String) -> Unit, autoOpenReview: Boolean = false) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val s = MealCheckInTexts.current
    val language = LocalConfiguration.current.locales[0].language
    var showPhotoDetails by rememberSaveable { mutableStateOf(false) }
    var showFullPhoto by rememberSaveable { mutableStateOf(false) }
    var editingFood by remember { mutableStateOf<MealFood?>(null) }

    val cameraPicker = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap: Bitmap? ->
        bitmap?.let(viewModel::chooseCameraPhoto)
    }
    val galleryPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let(viewModel::choosePhoto)
    }
    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri?.let(viewModel::choosePhoto)
    }

    LaunchedEffect(state.isLoaded) {
        if (state.isLoaded && state.draft.stage in 0..4) viewModel.resumeDraft()
    }
    LaunchedEffect(state.saveCompleted, state.savedMealId, autoOpenReview) {
        if (autoOpenReview && state.saveCompleted) state.savedMealId?.let(onOpenReview)
    }

    if (!state.isLoaded) {
        Box(Modifier.fillMaxSize().background(MealCanvas), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = MealBlue) }
        return
    }

    if (state.saveCompleted) {
        MealDoneScreen(onStartAnother = { viewModel.startNewMeal() }, onExit = onExit,
            onOpenReview = state.savedMealId?.let { id -> { onOpenReview(id) } })
        return
    }

    val currentPhotoPath = state.draft.photoPath
    if (showFullPhoto && currentPhotoPath != null) {
        BackHandler { showFullPhoto = false }
        FullPhotoScreen(currentPhotoPath, onBack = { showFullPhoto = false })
        return
    }

    val stage = state.draft.stage
    val progressStep = when (stage) { 0, 1 -> 0; 2 -> 1; 3 -> 2; else -> 3 }
    Column(Modifier.fillMaxSize().background(MealCanvas).windowInsetsPadding(WindowInsets.statusBars).imePadding()) {
        MealHeader(
            title = when (stage) {
                0 -> s.mealDetails
                1 -> s.addPhoto
                2 -> s.checkPhoto
                3 -> if (state.isAnalyzing) s.analyzing else s.addFoodItems
                else -> s.reviewFoodItems
            },
            progress = progressStep,
            onBack = {
                when (stage) {
                    0 -> onExit()
                    1 -> viewModel.setStage(0)
                    2 -> viewModel.setStage(1)
                    3 -> if (state.isAnalyzing) viewModel.cancelAnalysis() else viewModel.setStage(if (state.draft.photoPath == null) 1 else 2)
                    else -> viewModel.setStage(if (state.draft.photoPath == null) 3 else 3)
                }
            },
            subtitle = if (stage >= 2) "${s.draftPrefix} · ${state.draft.date}" else null,
        )

        Column(Modifier.weight(1f)) {
            when {
                stage == 0 -> MealDetailsContent(state.draft, viewModel::update)
                stage == 1 -> AddPhotoContent(
                    state = state,
                    onCamera = { cameraPicker.launch(null) },
                    onGallery = { galleryPicker.launch("image/*") },
                    onFiles = { filePicker.launch(arrayOf("image/*")) },
                )
                stage == 2 -> PhotoPreviewContent(state.draft.photoPath, onFullPhoto = { showFullPhoto = true }, onReplace = { viewModel.setStage(1) }, onRemove = viewModel::removePhoto)
                stage == 3 && state.isAnalyzing -> AnalysisProgressContent(state.draft.photoPath, onCancel = viewModel::cancelAnalysis)
                stage == 3 && state.analysisFailed -> AnalysisFailureContent(onRetry = { viewModel.analyzePhoto(language) }, onManual = viewModel::openManualEntry)
                stage == 3 -> AnalyzeOrManualContent(
                    photoPath = state.draft.photoPath,
                    onAnalyze = { viewModel.analyzePhoto(language) },
                    onLearnMore = { showPhotoDetails = true },
                    onManual = viewModel::openManualEntry,
                )
                else -> FoodReviewContent(
                    draft = state.draft,
                    saveError = state.saveFailed,
                    saving = state.isSaving,
                    onAdd = { editingFood = MealFood(name = "", source = FoodSource.PARENT) },
                    onEdit = { editingFood = it },
                    onRemove = viewModel::removeFood,
                    onConfirm = viewModel::requestExposureGoal,
                )
            }
        }

        if (stage in 0..2) {
            MealFooter(
                state = state,
                label = when (stage) { 0 -> s.nextPhoto; 1 -> s.checkPhoto; else -> s.usePhoto },
                enabled = when (stage) { 0 -> state.draft.mealType.isNotBlank() && state.draft.setting.isNotBlank(); 1 -> state.draft.photoPath != null; else -> state.draft.photoPath != null },
                onContinue = { when (stage) { 0 -> viewModel.setStage(1); 1 -> viewModel.setStage(2); else -> viewModel.setStage(3) } },
            )
        } else if (stage == 3 && !state.isAnalyzing && !state.analysisFailed) {
            MealDraftStatus(state)
        }
    }

    if (showPhotoDetails) {
        AlertDialog(
            onDismissRequest = { showPhotoDetails = false },
            title = { Text(s.learnConsentTitle, color = MealNavy) },
            text = { Text(s.learnConsentBody, color = MealMuted) },
            confirmButton = { TextButton(onClick = { showPhotoDetails = false }) { Text(s.close) } },
        )
    }
    editingFood?.let { food ->
        FoodEditorSheet(food = food, onDismiss = { editingFood = null }, onSave = { viewModel.updateFood(it); editingFood = null })
    }
    if (state.exposureSheet != ExposureSheet.NONE) {
        ModalBottomSheet(
            onDismissRequest = { if (state.exposureSheet == ExposureSheet.EXPLANATION) viewModel.backToExposureSelection() else viewModel.dismissExposureSheet() },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = androidx.compose.ui.graphics.Color.White,
        ) {
            when (state.exposureSheet) {
                ExposureSheet.SELECT -> ExposureGoalSheet(
                    foods = state.draft.foods,
                    selectedFoodId = state.selectedExposureFoodId,
                    isSaving = state.isSaving,
                    saveFailed = state.saveFailed,
                    onSelectFood = viewModel::selectExposureFood,
                    onInfo = viewModel::showExposureExplanation,
                    onBack = viewModel::dismissExposureSheet,
                    onConfirm = viewModel::confirmExposureGoal,
                    onSkip = viewModel::skipExposureGoal,
                )
                ExposureSheet.EXPLANATION -> ExposureTrackerExplanation(onBack = viewModel::backToExposureSelection)
                ExposureSheet.NONE -> Unit
            }
        }
    }
}

@Composable
private fun MealHeader(title: String, progress: Int, onBack: () -> Unit, subtitle: String?) {
    Row(Modifier.fillMaxWidth().padding(start = 24.dp, end = 24.dp, top = 8.dp, bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Surface(color = androidx.compose.ui.graphics.Color.White, shape = CircleShape, shadowElevation = 2.dp, modifier = Modifier.size(38.dp).clickable(onClick = onBack)) {
            Box(contentAlignment = Alignment.Center) { FigmaIcon(R.drawable.ic_figma_back, size = 18.dp) }
        }
        Column(Modifier.padding(start = 12.dp)) {
            Text(title, color = MealNavy, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
            if (subtitle != null) Text(subtitle, color = MealMuted, fontSize = 10.sp)
        }
    }
    Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        repeat(5) { index ->
            Box(Modifier.weight(1f).height(4.dp).background(if (index <= progress) MealBlue else MealBorder, RoundedCornerShape(999.dp)))
        }
    }
}

@Composable
private fun MealDetailsContent(draft: MealCheckInDraft, onChange: (MealCheckInDraft) -> Unit) {
    val s = MealCheckInTexts.current
    val locale = LocalConfiguration.current.locales[0]
    val dateParts = remember(draft.date) { draft.date.split("-").mapNotNull(String::toIntOrNull) }
    val today = remember { Calendar.getInstance() }
    var dateExpanded by rememberSaveable { mutableStateOf(false) }
    var pendingYear by rememberSaveable(draft.date) { mutableStateOf(dateParts.getOrNull(0) ?: today.get(Calendar.YEAR)) }
    var pendingMonth by rememberSaveable(draft.date) { mutableStateOf(dateParts.getOrNull(1) ?: today.get(Calendar.MONTH) + 1) }
    var pendingDay by rememberSaveable(draft.date) { mutableStateOf(dateParts.getOrNull(2) ?: today.get(Calendar.DAY_OF_MONTH)) }
    var openDateUnit by rememberSaveable { mutableStateOf<String?>(null) }
    val monthOptions = remember(locale) { (1..12).map { month ->
        val calendar = Calendar.getInstance().apply { set(Calendar.MONTH, month - 1) }
        month to SimpleDateFormat("MMM", locale).format(calendar.time)
    } }
    val maximumDay = Calendar.getInstance().apply { set(pendingYear, pendingMonth - 1, 1) }.getActualMaximum(Calendar.DAY_OF_MONTH)
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 14.dp)) {
        Text(s.settingOfMeal, color = MealNavy, fontSize = 23.sp, fontWeight = FontWeight.Bold)
        FieldLabel(s.mealDate)
        Surface(color = androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(12.dp), border = BorderStroke(1.dp, MealBorder), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                Row(Modifier.fillMaxWidth().height(30.dp).clickable { dateExpanded = !dateExpanded; openDateUnit = null }, verticalAlignment = Alignment.CenterVertically) {
                    Text(formatMealDate(draft.date, locale, s.today), color = MealNavy, fontSize = 12.sp, modifier = Modifier.weight(1f))
                    FigmaIcon(R.drawable.ic_figma_chevron_down, size = 14.dp)
                }
                if (dateExpanded) {
                    Text(s.selectDate, color = MealNavy, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 5.dp, bottom = 4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        DateDropdown(s.month, pendingMonth, monthOptions, expanded = openDateUnit == "month", onToggle = { openDateUnit = if (openDateUnit == "month") null else "month" }, onDismiss = { openDateUnit = null }, onSelect = { pendingMonth = it; pendingDay = pendingDay.coerceAtMost(Calendar.getInstance().apply { set(pendingYear, it - 1, 1) }.getActualMaximum(Calendar.DAY_OF_MONTH)); openDateUnit = null }, modifier = Modifier.weight(1f))
                        DateDropdown(s.day, pendingDay, (1..maximumDay).map { it to it.toString() }, expanded = openDateUnit == "day", onToggle = { openDateUnit = if (openDateUnit == "day") null else "day" }, onDismiss = { openDateUnit = null }, onSelect = { pendingDay = it; openDateUnit = null }, modifier = Modifier.weight(1f))
                        DateDropdown(s.year, pendingYear, (1900..today.get(Calendar.YEAR) + 1).reversed().map { it to it.toString() }, expanded = openDateUnit == "year", onToggle = { openDateUnit = if (openDateUnit == "year") null else "year" }, onDismiss = { openDateUnit = null }, onSelect = { pendingYear = it; pendingDay = pendingDay.coerceAtMost(Calendar.getInstance().apply { set(it, pendingMonth - 1, 1) }.getActualMaximum(Calendar.DAY_OF_MONTH)); openDateUnit = null }, modifier = Modifier.weight(1f))
                    }
                    MealPrimaryButton(s.confirmDate, onClick = {
                        onChange(draft.copy(date = "%04d-%02d-%02d".format(Locale.US, pendingYear, pendingMonth, pendingDay)))
                        dateExpanded = false
                        openDateUnit = null
                    }, modifier = Modifier.padding(top = 12.dp), height = 34.dp)
                }
            }
        }
        FieldLabel(s.mealType, Modifier.padding(top = 14.dp))
        OptionGrid(options = MealTypes, selected = draft.mealType, onSelect = { onChange(draft.copy(mealType = it)) }, icons = listOf(R.drawable.ic_figma_breakfast, R.drawable.ic_figma_lunch, R.drawable.ic_figma_dinner, R.drawable.ic_figma_snack))
        FieldLabel(s.setting, Modifier.padding(top = 10.dp))
        OptionGrid(options = MealSettings, selected = draft.setting, onSelect = { onChange(draft.copy(setting = it)) }, icons = listOf(R.drawable.ic_figma_home, R.drawable.ic_figma_restaurant, R.drawable.ic_figma_graduation_cap, R.drawable.ic_meal_other))
    }
}

@Composable
private fun DateDropdown(label: String, selected: Int, options: List<Pair<Int, String>>, expanded: Boolean, onToggle: () -> Unit, onDismiss: () -> Unit, onSelect: (Int) -> Unit, modifier: Modifier = Modifier) {
    val selectedLabel = options.firstOrNull { it.first == selected }?.second ?: selected.toString()
    val listState = rememberLazyListState()
    LaunchedEffect(expanded, selected) {
        if (expanded) listState.scrollToItem(options.indexOfFirst { it.first == selected }.coerceAtLeast(0))
    }
    Column(modifier) {
        Text(label, color = MealNavy, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(bottom = 5.dp))
        BoxWithConstraints {
            val popupWidth = maxWidth
            Surface(color = MealCanvas, shape = RoundedCornerShape(10.dp), border = BorderStroke(1.dp, MealBorder), modifier = Modifier.fillMaxWidth().height(44.dp).clickable(onClick = onToggle)) {
                Row(Modifier.padding(horizontal = 9.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(selectedLabel, color = MealNavy, fontSize = 11.sp, modifier = Modifier.weight(1f), maxLines = 1)
                    FigmaIcon(R.drawable.ic_figma_chevron_down, size = 13.dp)
                }
            }
            if (expanded) {
                Popup(popupPositionProvider = datePopupPositionProvider, onDismissRequest = onDismiss, properties = PopupProperties(focusable = true)) {
                    Surface(color = androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(10.dp), border = BorderStroke(1.dp, MealBorder), shadowElevation = 6.dp, modifier = Modifier.width(popupWidth).height(152.dp)) {
                        LazyColumn(modifier = Modifier.fillMaxSize(), state = listState) {
                            items(options, key = { it.first }) { (value, optionLabel) ->
                                Row(Modifier.fillMaxWidth().height(38.dp).background(if (value == selected) MealSoftBlue else androidx.compose.ui.graphics.Color.White).clickable { onSelect(value) }.padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(optionLabel, color = MealNavy, fontSize = 11.sp, modifier = Modifier.weight(1f), maxLines = 1)
                                    if (value == selected) FigmaIcon(R.drawable.ic_figma_check, size = 11.dp, tint = MealBlue)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private val datePopupPositionProvider = object : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize): IntOffset {
        val x = anchorBounds.left.coerceIn(0, (windowSize.width - popupContentSize.width).coerceAtLeast(0))
        val preferredY = if (anchorBounds.bottom + popupContentSize.height <= windowSize.height) anchorBounds.bottom + 4 else anchorBounds.top - popupContentSize.height - 4
        val y = preferredY.coerceIn(0, (windowSize.height - popupContentSize.height).coerceAtLeast(0))
        return IntOffset(x, y)
    }
}

@Composable
private fun AddPhotoContent(state: MealCheckInUiState, onCamera: () -> Unit, onGallery: () -> Unit, onFiles: () -> Unit) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 14.dp)) {
        Surface(color = MealNavy, shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(18.dp)) {
                Text(s.addPhoto, color = androidx.compose.ui.graphics.Color.White, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                Text(s.wholePlate, color = androidx.compose.ui.graphics.Color.White, fontSize = 11.sp, modifier = Modifier.padding(top = 6.dp, bottom = 14.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(painter = painterResource(R.drawable.meal_example_photo), contentDescription = s.wholePlate, contentScale = ContentScale.Crop, modifier = Modifier.size(112.dp).clip(RoundedCornerShape(16.dp)))
                    Column(Modifier.weight(1f).padding(start = 12.dp)) {
                        listOf(s.goodLight, s.centeredPlate, s.visibleFood).forEachIndexed { i, text ->
                            Row(Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                Surface(color = androidx.compose.ui.graphics.Color.White, shape = CircleShape, modifier = Modifier.size(24.dp)) {
                                    Box(contentAlignment = Alignment.Center) { FigmaIcon(listOf(R.drawable.ic_figma_camera, R.drawable.ic_figma_gallery, R.drawable.ic_figma_file_image)[i], size = 14.dp, tint = MealBlue) }
                                }
                                Text(text, color = androidx.compose.ui.graphics.Color.White, fontSize = 10.sp, lineHeight = 13.sp, modifier = Modifier.padding(start = 9.dp))
                            }
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        ChoiceAction(s.takePhoto, R.drawable.ic_figma_camera, onCamera)
        ChoiceAction(s.gallery, R.drawable.ic_figma_gallery, onGallery, Modifier.padding(top = 8.dp))
        ChoiceAction(s.files, R.drawable.ic_figma_file_image, onFiles, Modifier.padding(top = 8.dp), detail = s.supportedImages)
        if (state.isImportingPhoto) CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally).padding(top = 18.dp), color = MealBlue)
        if (state.photoError != null) Text(s.photoError, color = MaterialTheme.colorScheme.error, fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp))
    }
}

@Composable
private fun PhotoPreviewContent(photoPath: String?, onFullPhoto: () -> Unit, onReplace: () -> Unit, onRemove: () -> Unit) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 14.dp)) {
        if (photoPath != null) PhotoImage(photoPath, Modifier.fillMaxWidth().height(318.dp).clickable(onClick = onFullPhoto), ContentScale.Crop)
        Row(Modifier.fillMaxWidth().clickable(onClick = onFullPhoto).padding(vertical = 10.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
            FigmaIcon(R.drawable.ic_figma_expand, size = 15.dp)
            Text(s.tapFullPhoto, color = MealBlue, fontSize = 11.sp, modifier = Modifier.padding(start = 5.dp))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MealSecondaryButton(s.replacePhoto, onReplace, Modifier.weight(1f), leadingIcon = R.drawable.ic_figma_refresh)
            MealSecondaryButton(s.removePhoto, onRemove, Modifier.weight(1f), destructive = true, leadingIcon = R.drawable.ic_figma_trash)
        }
        Surface(color = MealSoftBlue, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(top = 10.dp)) {
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
                FigmaIcon(R.drawable.ic_figma_lock, size = 15.dp)
                Text(s.localPhotoNotice, color = MealNavy, fontSize = 10.sp, lineHeight = 14.sp, modifier = Modifier.padding(start = 8.dp))
            }
        }
    }
}



@Composable
private fun AnalyzeOrManualContent(photoPath: String?, onAnalyze: () -> Unit, onLearnMore: () -> Unit, onManual: () -> Unit) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 14.dp)) {
        if (photoPath != null) PhotoImage(photoPath, Modifier.fillMaxWidth().height(150.dp), ContentScale.Crop)
        Surface(color = MealSoftBlue, shape = RoundedCornerShape(12.dp), border = BorderStroke(1.dp, MealBorder), modifier = Modifier.fillMaxWidth().padding(top = 10.dp)) {
            Column(Modifier.padding(12.dp)) {
                Text(s.photoConsent, color = MealNavy, fontSize = 11.sp, lineHeight = 15.sp)
                Text(s.learnPhoto, color = MealBlue, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 7.dp).clickable(onClick = onLearnMore))
            }
        }
        MealPrimaryButton(s.analyzePhoto, onAnalyze, Modifier.padding(start = 14.dp, end = 14.dp, top = 22.dp), leadingIcon = R.drawable.ic_figma_sparkles)
        MealSecondaryButton(s.manualEntry, onManual, Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp))
    }
}

@Composable
private fun AnalysisProgressContent(photoPath: String?, onCancel: () -> Unit) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 14.dp)) {
        Box(Modifier.fillMaxWidth().height(318.dp), contentAlignment = Alignment.Center) {
            if (photoPath != null) PhotoImage(photoPath, Modifier.fillMaxSize(), ContentScale.Crop)
            Surface(color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.94f), shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth(.82f)) {
                Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = MealBlue)
                    Text(s.analyzing, color = MealNavy, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 12.dp))
                }
            }
        }
        Surface(color = MealSoftBlue, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(top = 10.dp)) { Text(s.photoConsent, color = MealNavy, fontSize = 10.sp, lineHeight = 14.sp, modifier = Modifier.padding(12.dp)) }
        MealSecondaryButton(s.cancelAnalysis, onCancel, Modifier.fillMaxWidth().padding(top = 10.dp), leadingIcon = R.drawable.ic_figma_close)
    }
}

@Composable
private fun AnalysisFailureContent(onRetry: () -> Unit, onManual: () -> Unit) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 40.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        FigmaIcon(R.drawable.ic_figma_cloud_off, size = 34.dp, tint = MealBlue)
        Text(s.analysisFailed, color = MealNavy, fontSize = 16.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp, bottom = 20.dp))
        MealPrimaryButton(s.retry, onRetry, leadingIcon = R.drawable.ic_figma_refresh)
        MealSecondaryButton(s.manualEntry, onManual, Modifier.fillMaxWidth().padding(top = 10.dp), leadingIcon = R.drawable.ic_figma_plus)
    }
}

@Composable
private fun FoodReviewContent(draft: MealCheckInDraft, saveError: Boolean, saving: Boolean, onAdd: () -> Unit, onEdit: (MealFood) -> Unit, onRemove: (String) -> Unit, onConfirm: () -> Unit) {
    val s = MealCheckInTexts.current
    val suggestionCount = draft.foods.count { it.source == FoodSource.AI }
    val countLabel = if (suggestionCount > 0) "$suggestionCount ${s.suggestedFoodCount}" else "${draft.foods.size} ${s.foodItemCount}"
    Column(Modifier.fillMaxSize()) {
      Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(countLabel, color = MealNavy, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text(s.parentReview, color = MealMuted, fontSize = 9.sp, modifier = Modifier.padding(top = 3.dp))
            }
            StatusPill(s.parentReview, MealSoftBlue, MealBlue)
        }
        Row(Modifier.padding(top = 8.dp, bottom = 9.dp), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            StatusPill(s.aiSuggestion, MealAiSoft, MealAiInk)
            StatusPill(s.parentInput, MealParentSoft, MealParentInk)
        }
        draft.foods.forEach { food -> FoodSummaryCard(food, onEdit = { onEdit(food) }, onRemove = { onRemove(food.id) }) }
        MealSecondaryButton(s.addFood, onAdd, Modifier.fillMaxWidth().padding(top = 10.dp), leadingIcon = R.drawable.ic_figma_plus)
        Surface(color = MealSoftBlue, shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().padding(top = 10.dp)) {
            Row(Modifier.padding(11.dp), verticalAlignment = Alignment.CenterVertically) {
                FigmaIcon(R.drawable.ic_figma_shield_check, size = 15.dp)
                Text(s.aiReviewHint, color = MealNavy, fontSize = 10.sp, modifier = Modifier.padding(start = 7.dp))
            }
        }
        if (saveError) Text(s.saveError, color = MaterialTheme.colorScheme.error, fontSize = 11.sp, modifier = Modifier.padding(top = 8.dp))
        if (saving) Text(s.saving, color = MealMuted, fontSize = 10.sp, modifier = Modifier.padding(top = 6.dp))
        if (draft.foods.isEmpty()) Text(s.noFoods, color = MealMuted, fontSize = 11.sp, modifier = Modifier.padding(top = 8.dp))
    }
      Column(Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.navigationBars).padding(horizontal = 24.dp, vertical = 10.dp)) {
        MealPrimaryButton(s.confirmFoods, onConfirm, enabled = draft.foods.isNotEmpty() && !saving, leadingIcon = R.drawable.ic_figma_check)
      }
    }
}

@Composable
private fun ExposureGoalSheet(
    foods: List<MealFood>,
    selectedFoodId: String?,
    isSaving: Boolean,
    saveFailed: Boolean,
    onSelectFood: (String) -> Unit,
    onInfo: () -> Unit,
    onBack: () -> Unit,
    onConfirm: () -> Unit,
    onSkip: () -> Unit,
) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxWidth().height(550.dp).padding(horizontal = 24.dp)) {
        Row(Modifier.fillMaxWidth().padding(top = 5.dp, bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            FigmaIcon(R.drawable.ic_figma_back, modifier = Modifier.clickable(onClick = onBack), size = 18.dp, tint = MealNavy)
            Spacer(Modifier.weight(1f))
            FigmaIcon(R.drawable.ic_figma_close, modifier = Modifier.clickable(onClick = onBack), size = 16.dp, tint = MealNavy)
        }
        Text(s.addExposureGoalTitle, color = MealNavy, fontSize = 19.sp, fontWeight = FontWeight.Bold)
        Row(Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(s.chooseExposureFood, color = MealMuted, fontSize = 10.sp, modifier = Modifier.weight(1f))
            Box(Modifier.size(32.dp).clickable(onClick = onInfo), contentAlignment = Alignment.Center) {
                FigmaIcon(R.drawable.ic_figma_help, size = 18.dp, tint = MealBlue, description = s.exposureTrackerTitle)
            }
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            foods.forEach { food ->
                val selected = food.id == selectedFoodId
                Surface(color = if (selected) MealCanvas else androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(14.dp), border = BorderStroke(if (selected) 2.dp else 1.dp, if (selected) MealBlue else MealBorder), modifier = Modifier.fillMaxWidth().height(95.dp).clickable { onSelectFood(food.id) }) {
                    Row(Modifier.padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(food.name, color = MealNavy, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        StatusPill(food.exposureGoal.ifBlank { s.exposureStageNotSet }, MealSoftBlue, MealBlue)
                        Spacer(Modifier.width(12.dp))
                        SelectionMark(selected)
                    }
                }
            }
        }
        if (saveFailed) Text(s.saveError, color = MaterialTheme.colorScheme.error, fontSize = 10.sp, modifier = Modifier.padding(top = 6.dp))
        MealPrimaryButton(s.selectMealExposureGoal, onConfirm, Modifier.padding(top = 12.dp), enabled = selectedFoodId != null && !isSaving)
        TextButton(onClick = onSkip, enabled = !isSaving, modifier = Modifier.fillMaxWidth().padding(bottom = 7.dp)) { Text(s.skipExposureGoal, color = MealNavy, fontSize = 11.sp) }
    }
}

@Composable
private fun ExposureTrackerExplanation(onBack: () -> Unit) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxWidth().height(390.dp).padding(horizontal = 18.dp)) {
        Row(Modifier.fillMaxWidth().padding(top = 5.dp, bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(s.exposureTrackerTitle, color = MealNavy, fontSize = 19.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            FigmaIcon(R.drawable.ic_figma_close, modifier = Modifier.clickable(onClick = onBack), size = 16.dp, tint = MealNavy)
        }
        Surface(color = MealSoftBlue, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
            Text(s.exposureTrackerDescription, color = MealNavy, fontSize = 11.sp, lineHeight = 16.sp, modifier = Modifier.padding(12.dp))
        }
        Text(s.exposureLadderTitle, color = MealNavy, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 18.dp, bottom = 10.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            s.exposureStepLabels.forEachIndexed { index, label ->
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Surface(color = MealSoftBlue, shape = CircleShape, border = BorderStroke(1.dp, MealBorder), modifier = Modifier.size(32.dp)) {
                        Box(contentAlignment = Alignment.Center) { Text((index + 1).toString(), color = MealBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold) }
                    }
                    Text(label, color = MealNavy, fontSize = 8.sp, lineHeight = 10.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 5.dp))
                }
            }
        }
        Spacer(Modifier.weight(1f))
        MealPrimaryButton(s.backToExposureGoal, onBack, Modifier.padding(bottom = 12.dp))
    }
}

@Composable
private fun FoodSummaryCard(food: MealFood, onEdit: () -> Unit, onRemove: () -> Unit) {
    val s = MealCheckInTexts.current
    Surface(color = androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, MealBorder), modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(food.name.ifBlank { s.foodName }, color = MealNavy, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                StatusPill(if (food.source == FoodSource.AI) s.aiSuggestion else s.parentInput, if (food.source == FoodSource.AI) MealAiSoft else MealParentSoft, if (food.source == FoodSource.AI) MealAiInk else MealParentInk)
                if (food.exposureGoal.isNotBlank()) StatusPill(s.exposureGoal, MealSoftBlue, MealBlue)
            }
            HorizontalDivider(color = MealBorder, modifier = Modifier.padding(vertical = 8.dp))
            SummaryLabel(s.ingredients, food.ingredients.joinToString().ifBlank { s.emptyValue })
            Row(Modifier.padding(top = 7.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Column(Modifier.weight(1f)) { SummaryLabel(s.presentation, food.presentation.ifBlank { s.emptyValue }) }
                Column(Modifier.weight(1f)) { SummaryLabel(s.servingNote, food.servingNote.ifBlank { s.emptyValue }) }
            }
            if (food.traits.isNotEmpty()) SummaryLabel(s.foodTraits, food.traits.joinToString(" · ") { s.traitLabel(it) }, Modifier.padding(top = 7.dp))
            if (food.history.isNotBlank()) SummaryLabel(s.foodHistory, s.foodHistoryLabel(food.history), Modifier.padding(top = 7.dp))
            Row(Modifier.padding(top = 9.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MealSecondaryButton(s.edit, onEdit, Modifier.weight(1f), compact = true)
                MealSecondaryButton(s.removeFood, onRemove, Modifier.weight(1f), compact = true, destructive = true)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
internal fun FoodEditorSheet(food: MealFood, onDismiss: () -> Unit, onSave: (MealFood) -> Unit, saveFailed: Boolean = false, isSaving: Boolean = false) {
    val s = MealCheckInTexts.current
    var name by remember(food.id) { mutableStateOf(food.name) }
    var ingredients by remember(food.id) { mutableStateOf(food.ingredients) }
    var ingredientDraft by remember(food.id) { mutableStateOf("") }
    var presentation by remember(food.id) { mutableStateOf(food.presentation) }
    var servingNote by remember(food.id) { mutableStateOf(food.servingNote) }
    var history by remember(food.id) { mutableStateOf(canonicalFoodHistory(food.history)) }
    var traits by remember(food.id) { mutableStateOf(food.traits) }
    var traitGroups by remember(food.id) { mutableStateOf(food.traitSelections) }
    var selectorDraft by remember(food.id) { mutableStateOf(food.traitSelections) }
    var showTraitsSelector by rememberSaveable(food.id) { mutableStateOf(false) }
    var hasExposureGoal by remember(food.id) { mutableStateOf(food.exposureGoal.isNotBlank()) }
    ModalBottomSheet(onDismissRequest = { if (showTraitsSelector) showTraitsSelector = false else onDismiss() }, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = androidx.compose.ui.graphics.Color.White) {
        if (showTraitsSelector) {
            FoodTraitsSelectorContent(
                selected = selectorDraft,
                onChange = { selectorDraft = it },
                onCancel = { showTraitsSelector = false },
                onSave = {
                    val savedGroups = selectorDraft.filterValues { it.isNotEmpty() }
                    traitGroups = savedGroups
                    traits = savedGroups.values.flatten().distinct()
                    showTraitsSelector = false
                },
            )
        } else {
        Column(Modifier.fillMaxWidth().weight(1f, fill = false).imePadding().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (food.name.isBlank()) s.addFood else "${s.reviewPrefix} ${food.name}", color = MealNavy, fontSize = 20.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                FigmaIcon(R.drawable.ic_figma_close, modifier = Modifier.clickable(onClick = onDismiss), size = 16.dp)
            }
            Text(s.editFoodIntro, color = MealMuted, fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp, bottom = 8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusPill(if (food.source == FoodSource.AI) s.aiSuggestion else s.parentInput, if (food.source == FoodSource.AI) MealAiSoft else MealParentSoft, MealNavy)
            }
            FieldLabel(s.foodName)
            MealTextInput(name, { name = it }, s.foodName)
            FieldLabel(s.ingredients, Modifier.padding(top = 8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                ingredients.forEach { ingredient ->
                    AssistChip(onClick = { ingredients = ingredients - ingredient }, label = { Row(verticalAlignment = Alignment.CenterVertically) { Text(ingredient); FigmaIcon(R.drawable.ic_figma_close, modifier = Modifier.padding(start = 4.dp), size = 10.dp) } })
                }
            }
            Row(Modifier.padding(top = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                MealTextInput(ingredientDraft, { ingredientDraft = it }, s.addIngredient, Modifier.weight(1f))
                TextButton(onClick = { if (ingredientDraft.isNotBlank()) { ingredients = ingredients + ingredientDraft.trim(); ingredientDraft = "" } }) { FigmaIcon(R.drawable.ic_figma_plus, size = 11.dp, tint = MealBlue); Text(s.addIngredient) }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 7.dp)) {
                Column(Modifier.weight(1f)) {
                    FieldLabel(s.presentation)
                    MealTextInput(presentation, { presentation = it }, s.presentation)
                }
                Column(Modifier.weight(1f)) {
                    FieldLabel(s.servingNote)
                    MealTextInput(servingNote, { servingNote = it }, s.servingNote)
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                Text(s.foodTraits, color = MealNavy, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                Text(s.optional, color = MealMuted, fontSize = 9.sp)
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                traits.forEach { trait ->
                    StatusPill(s.traitLabel(trait), if (food.source == FoodSource.AI) MealAiSoft else MealParentSoft, if (food.source == FoodSource.AI) MealAiInk else MealParentInk)
                }
            }
            TextButton(onClick = { selectorDraft = if (traitGroups.isEmpty()) inferTraitGroups(traits) else traitGroups; showTraitsSelector = true }, modifier = Modifier.fillMaxWidth()) {
                Text(s.editAllTraits, color = MealBlue, fontSize = 11.sp)
                FigmaIcon(R.drawable.ic_figma_chevron_right, modifier = Modifier.padding(start = 4.dp), size = 13.dp, tint = MealBlue)
            }
            FieldLabel(s.foodHistory, Modifier.padding(top = 5.dp))
            FoodHistoryDropdown(
                selected = history,
                options = listOf("Usually accepted" to s.historyUsually, "Sometimes accepted" to s.historySometimes, "Not sure" to s.historyNotSure),
                placeholder = s.selectFoodHistory,
                onSelect = { history = it },
            )
            Surface(color = MealSoftBlue, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 10.dp).clickable { hasExposureGoal = !hasExposureGoal }) {
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(s.exposureGoal, color = MealBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(if (hasExposureGoal) s.exposureGoalStep else s.addExposureGoal, color = MealNavy, fontSize = 12.sp)
                    }
                    FigmaIcon(if (hasExposureGoal) R.drawable.ic_figma_check else R.drawable.ic_figma_plus, size = 16.dp, tint = MealBlue)
                }
            }
            if (saveFailed) Text(s.saveError, color = MealDestructiveInk, fontSize = 11.sp)
            if (isSaving) Text(s.saving, color = MealMuted, fontSize = 11.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                MealSecondaryButton(s.cancel, onDismiss, Modifier.weight(1f))
                MealPrimaryButton(s.saveFood, { onSave(food.copy(name = name.trim(), ingredients = ingredients, presentation = presentation, servingNote = servingNote, traits = traits, traitSelections = traitGroups, history = history, exposureGoal = if (hasExposureGoal) food.exposureGoal.ifBlank { s.exposureGoalStep } else "")) }, Modifier.weight(1f), enabled = name.isNotBlank() && !isSaving, leadingIcon = R.drawable.ic_figma_check)
            }
        }
        }
    }
}

private data class TraitCategory(val key: String, val options: List<String>, val multiSelect: Boolean, val optional: Boolean = false)

private val traitCategories = listOf(
    TraitCategory("Texture", listOf("Smooth / creamy", "Soft / mushy", "Lumpy / chunky", "Crunchy / crisp", "Chewy / tough", "Wet / slippery", "Mixed textures", "Other"), multiSelect = true),
    TraitCategory("Taste type", listOf("Sweet", "Salty", "Sour", "Bitter", "Spicy / hot", "Other"), multiSelect = true),
    TraitCategory("Taste intensity", listOf("Mild", "Strong"), multiSelect = false, optional = true),
    TraitCategory("Smell", listOf("Strong", "Mild", "No noticeable smell", "Not sure"), multiSelect = false),
    TraitCategory("Color", listOf("Green", "Yellow", "Red", "Brown", "White", "Other"), multiSelect = true, optional = true),
    TraitCategory("Shape and size", listOf("Consistent", "Varied", "Not sure"), multiSelect = false),
    TraitCategory("Ingredient visibility", listOf("Clearly visible", "Partly visible", "Blended / not separately visible", "Not sure"), multiSelect = false),
    TraitCategory("Temperature", listOf("Hot", "Warm", "Room temperature", "Cool / chilled", "Not sure"), multiSelect = false),
)

private fun inferTraitGroups(traits: List<String>): Map<String, List<String>> {
    val mapped = mutableMapOf<String, MutableList<String>>()
    traits.forEach { trait ->
        val category = when (trait) {
            "Soft" -> "Texture"
            "Cool" -> "Temperature"
            "Orange" -> "Color"
            else -> traitCategories.firstOrNull { trait in it.options && trait !in listOf("Mild", "Strong", "Not sure", "Other") }?.key
                ?: when (trait) { "Mild", "Strong" -> "Taste intensity"; else -> null }
        }
        if (category != null) mapped.getOrPut(category) { mutableListOf() } += when (trait) {
            "Soft" -> "Soft / mushy"
            "Cool" -> "Cool / chilled"
            else -> trait
        }
    }
    return mapped.mapValues { it.value.toList() }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FoodTraitsSelectorContent(selected: Map<String, List<String>>, onChange: (Map<String, List<String>>) -> Unit, onCancel: () -> Unit, onSave: () -> Unit) {
    val s = MealCheckInTexts.current
    var colorDraft by rememberSaveable { mutableStateOf("") }
    var shapeDraft by rememberSaveable { mutableStateOf("") }
    Column(Modifier.fillMaxWidth().fillMaxHeight(0.9f).imePadding()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            FigmaIcon(R.drawable.ic_figma_back, modifier = Modifier.clickable(onClick = onCancel), size = 18.dp, tint = MealNavy)
            Column(Modifier.weight(1f).padding(start = 12.dp)) {
                Text(s.foodTraits, color = MealNavy, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(s.traitSelectorSubtitle, color = MealMuted, fontSize = 10.sp)
            }
            FigmaIcon(R.drawable.ic_figma_close, modifier = Modifier.clickable(onClick = onCancel), size = 16.dp, tint = MealNavy)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 22.dp)) {
            traitCategories.forEach { category ->
                Row(Modifier.fillMaxWidth().padding(top = 11.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(s.traitLabel(category.key), color = MealNavy, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                    Text(if (category.optional) s.optional else if (category.multiSelect) s.traitMultiSelect else s.traitSingleSelect, color = MealMuted, fontSize = 9.sp)
                }
                val current = selected[category.key].orEmpty()
                val visible = category.options + current.filterNot { it in category.options }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    visible.forEach { option ->
                        val isSelected = option in current
                        Surface(color = if (isSelected) MealParentSoft else androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(999.dp), border = BorderStroke(1.dp, if (isSelected) MealParentInk else MealBorder), modifier = Modifier.clickable {
                            val updated = if (category.multiSelect) {
                                if (isSelected) current - option else current + option
                            } else {
                                if (isSelected) emptyList() else listOf(option)
                            }
                            onChange(selected + (category.key to updated))
                        }) {
                            Text(s.traitLabel(option), color = if (isSelected) MealParentInk else MealNavy, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp))
                        }
                    }
                }
                if (category.key == "Shape and size") {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        selected["Shape note"].orEmpty().forEach { note ->
                            Surface(color = MealParentSoft, shape = RoundedCornerShape(999.dp), border = BorderStroke(1.dp, MealParentInk), modifier = Modifier.clickable { onChange(selected + ("Shape note" to selected["Shape note"].orEmpty().filterNot { it == note })) }) {
                                Text("${s.traitLabel(note)} ×", color = MealParentInk, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp))
                            }
                        }
                    }
                }
                if (category.key == "Color" || category.key == "Shape and size") {
                    val isColor = category.key == "Color"
                    Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                        MealTextInput(if (isColor) colorDraft else shapeDraft, { if (isColor) colorDraft = it else shapeDraft = it }, if (isColor) s.addActualColor else s.addShapeNote, Modifier.weight(1f))
                        MealCompactAddButton(s.addExposureGoal, onClick = {
                            val value = (if (isColor) colorDraft else shapeDraft).trim()
                            if (value.isNotEmpty()) {
                                val key = if (isColor) "Color" else "Shape note"
                                onChange(selected + (key to (selected[key].orEmpty() + value).distinct()))
                                if (isColor) colorDraft = "" else shapeDraft = ""
                            }
                        }, enabled = (if (isColor) colorDraft else shapeDraft).isNotBlank())
                    }
                }
            }
        }
        Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MealSecondaryButton(s.cancel, onCancel, Modifier.weight(1f))
            MealPrimaryButton(s.saveTraits, onSave, Modifier.weight(1f), leadingIcon = R.drawable.ic_figma_check)
        }
    }
}

private fun canonicalFoodHistory(value: String): String = when (value) {
    "대체로 잘 먹음" -> "Usually accepted"
    "가끔 먹음" -> "Sometimes accepted"
    "잘 모르겠어요" -> "Not sure"
    else -> value
}

@Composable
private fun FoodHistoryDropdown(selected: String, options: List<Pair<String, String>>, placeholder: String, onSelect: (String) -> Unit) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    val selectedLabel = options.firstOrNull { it.first == selected }?.second ?: selected.ifBlank { placeholder }
    Column {
        Surface(color = androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(10.dp), border = BorderStroke(1.dp, MealBorder), modifier = Modifier.fillMaxWidth().height(46.dp).clickable { expanded = !expanded }) {
            Row(Modifier.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(selectedLabel, color = if (selected.isBlank()) MealMuted else MealNavy, fontSize = 12.sp, modifier = Modifier.weight(1f), maxLines = 1)
                FigmaIcon(R.drawable.ic_figma_chevron_down, size = 14.dp)
            }
        }
        if (expanded) {
            Surface(color = androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(10.dp), border = BorderStroke(1.dp, MealBorder), modifier = Modifier.fillMaxWidth().padding(top = 4.dp)) {
                Column {
                    options.forEach { (value, label) ->
                        Row(Modifier.fillMaxWidth().height(42.dp).background(if (selected == value) MealSoftBlue else androidx.compose.ui.graphics.Color.White).clickable { onSelect(value); expanded = false }.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(label, color = MealNavy, fontSize = 12.sp, modifier = Modifier.weight(1f))
                            if (selected == value) FigmaIcon(R.drawable.ic_figma_check, size = 13.dp, tint = MealBlue)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MealDoneScreen(onStartAnother: () -> Unit, onExit: () -> Unit, onOpenReview: (() -> Unit)?) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxSize().background(MealCanvas).windowInsetsPadding(WindowInsets.statusBars).padding(horizontal = 24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        FigmaIcon(R.drawable.ic_figma_check, size = 42.dp, tint = MealBlue)
        Text(s.mealSaved, color = MealNavy, fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 12.dp))
        Text(s.savedMessage, color = MealMuted, fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp, bottom = 22.dp))
        if (onOpenReview != null) MealPrimaryButton(AfterMealReviewTexts.current.title, onOpenReview)
        MealSecondaryButton(s.startAnother, onStartAnother, Modifier.padding(top = 8.dp))
        TextButton(onClick = onExit, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) { Text(s.home, color = MealBlue) }
    }
}

@Composable
private fun OptionGrid(options: List<Pair<String, String>>, selected: String, onSelect: (String) -> Unit, icons: List<Int>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        options.chunked(2).forEachIndexed { rowIndex, row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                row.forEachIndexed { col, (key, label) ->
                    val absoluteIndex = rowIndex * 2 + col
                    Surface(
                        color = if (selected == key) MealSoftBlue else androidx.compose.ui.graphics.Color.White,
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, if (selected == key) MealBlue else MealBorder),
                        shadowElevation = if (selected == key) 0.dp else 3.dp,
                        modifier = Modifier.weight(1f).height(76.dp).clickable { onSelect(key) },
                    ) {
                        Row(Modifier.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(42.dp).background(MealCanvas, RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                                FigmaIcon(icons[absoluteIndex], size = 21.dp, tint = MealNavy)
                            }
                            Text(label, color = MealNavy, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f).padding(start = 10.dp))
                            SelectionMark(selected == key)
                        }
                    }
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun SelectionMark(selected: Boolean) {
    Surface(color = if (selected) MealBlue else androidx.compose.ui.graphics.Color.White, shape = CircleShape, border = if (selected) null else BorderStroke(2.dp, MealBorder), modifier = Modifier.size(22.dp)) {
        if (selected) Box(contentAlignment = Alignment.Center) { FigmaIcon(R.drawable.ic_figma_check, size = 12.dp, tint = androidx.compose.ui.graphics.Color.White) }
    }
}



@Composable
private fun MealFooter(state: MealCheckInUiState, label: String, enabled: Boolean, onContinue: () -> Unit) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.navigationBars).padding(horizontal = 24.dp, vertical = 10.dp)) {
        MealPrimaryButton(label, onContinue, enabled = enabled, leadingIcon = if (label == s.nextPhoto) R.drawable.ic_figma_arrow_right else if (label == s.usePhoto) R.drawable.ic_figma_check else null)
        Text(if (state.isSaving) s.saving else if (state.saveFailed) s.saveError else s.savedDraft, color = if (state.saveFailed) MaterialTheme.colorScheme.error else MealMuted, fontSize = 9.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(top = 7.dp))
    }
}

@Composable
private fun MealDraftStatus(state: MealCheckInUiState) {
    val s = MealCheckInTexts.current
    Text(if (state.isSaving) s.saving else if (state.saveFailed) s.saveError else s.savedDraft, color = if (state.saveFailed) MaterialTheme.colorScheme.error else MealMuted, fontSize = 9.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.navigationBars).padding(vertical = 9.dp))
}



@Composable
private fun MealCompactAddButton(label: String, onClick: () -> Unit, enabled: Boolean) {
    Surface(color = if (enabled) MealBlue else MealBorder, shape = RoundedCornerShape(10.dp), modifier = Modifier.size(width = 64.dp, height = 42.dp).clickable(enabled = enabled, onClick = onClick)) {
        Box(contentAlignment = Alignment.Center) { Text(label, color = androidx.compose.ui.graphics.Color.White, fontSize = 10.sp, maxLines = 1) }
    }
}





@Composable
private fun FieldLabel(text: String, modifier: Modifier = Modifier) {
    Text(text, color = MealNavy, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, modifier = modifier.padding(top = 10.dp, bottom = 5.dp))
}



@Composable
private fun SummaryLabel(title: String, value: String, modifier: Modifier = Modifier) {
    Column(modifier) {
        Text(title, color = MealMuted, fontSize = 9.sp)
        Text(value, color = MealNavy, fontSize = 10.sp, modifier = Modifier.padding(top = 3.dp))
    }
}



private fun formatMealDate(raw: String, locale: Locale, todayLabel: String): String {
    val parsed = runCatching { SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(raw) }.getOrNull() ?: Date()
    val label = SimpleDateFormat(if (locale.language == "ko") "M월 d일" else "d MMMM", locale).format(parsed)
    val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    val currentYear = SimpleDateFormat("yyyy", Locale.US).format(Date())
    val year = raw.take(4)
    return when {
        raw == today -> "$todayLabel · $label"
        year != currentYear -> "$label · $year"
        else -> label
    }
}
