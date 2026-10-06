package com.mca.myapplication

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mca.myapplication.ui.components.FormFieldLabel
import com.mca.myapplication.ui.components.InfoBanner
import com.mca.myapplication.ui.components.NurtureTextField
import com.mca.myapplication.ui.theme.OnboardingColors
import com.mca.myapplication.ui.components.CompactAddButton
import com.mca.myapplication.ui.components.SquarePlusButton
import com.mca.myapplication.ui.components.RemovableToken
import com.mca.myapplication.ui.components.FigmaIcon
import com.mca.myapplication.R
import com.mca.myapplication.ui.components.OnboardingNavigationBar
import com.mca.myapplication.ui.components.OnboardingProgress
import com.mca.myapplication.ui.components.PrimaryActionButton
import com.mca.myapplication.ui.components.SelectionOption

private val Canvas get() = OnboardingColors.Canvas
private val Blue get() = OnboardingColors.Blue
private val Ink get() = OnboardingColors.Ink
private val Muted get() = OnboardingColors.Muted
private val Line get() = OnboardingColors.Line
private val SoftBlue get() = OnboardingColors.SoftBlue
private val pages = onboardingPages

@Composable
private fun T(key: String, child: String = ""): String = OnboardingStrings.display(key, child)

@Composable
fun OnboardingApp(viewModel: OnboardingViewModel, hasMealDraft: Boolean, onOpenMealCheckIn: (resume: Boolean) -> Unit) {
    val savedState by viewModel.state.collectAsStateWithLifecycle()
    var pageIndex by rememberSaveable { mutableStateOf(0) }
    var fields by rememberSaveable { mutableStateOf(mapOf<String, String>()) }
    var selected by rememberSaveable { mutableStateOf(mapOf<Int, Set<String>>()) }
    var safeFoods by rememberSaveable { mutableStateOf(listOf<String>()) }
    var safeFoodDraft by rememberSaveable { mutableStateOf("") }
    var safePreparation by rememberSaveable { mutableStateOf("") }
    var safePresentation by rememberSaveable { mutableStateOf("") }
    var showSafeFoodCard by rememberSaveable { mutableStateOf(false) }
    var noSafeFoods by rememberSaveable { mutableStateOf(false) }
    var tutorialPage by rememberSaveable { mutableStateOf(-1) }
    var completed by rememberSaveable { mutableStateOf(false) }
    var paused by rememberSaveable { mutableStateOf(false) }
    var restored by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(savedState.isLoaded) {
        if (savedState.isLoaded) {
            val draft = savedState.draft
            pageIndex = draft.step.coerceIn(0, pages.lastIndex)
            fields = draft.fields.filterKeys { it !in setOf("safeFoodDraft", "safePreparation", "safePresentation") }
            safeFoodDraft = draft.fields["safeFoodDraft"].orEmpty()
            safePreparation = draft.fields["safePreparation"].orEmpty()
            safePresentation = draft.fields["safePresentation"].orEmpty()
            selected = draft.choices.filterKeys { it != 16 }
            noSafeFoods = "No safe foods yet" in draft.choices[16].orEmpty()
            safeFoods = if (noSafeFoods) emptyList() else draft.safeFoods
            completed = draft.completed
            restored = true
        }
    }
    LaunchedEffect(restored, pageIndex, fields, selected, safeFoods, safeFoodDraft, safePreparation, safePresentation, noSafeFoods) {
        val savedFields = fields + mapOf("safeFoodDraft" to safeFoodDraft, "safePreparation" to safePreparation, "safePresentation" to safePresentation)
        val savedChoices = if (noSafeFoods) selected + (16 to setOf("No safe foods yet")) else selected - 16
        if (restored && savedState.isLoaded && !savedState.completed && !completed) viewModel.save(com.mca.myapplication.data.OnboardingDraft(pageIndex, savedFields, savedChoices, safeFoods))
    }
    LaunchedEffect(savedState.completed) { if (savedState.completed) completed = true }
    val page = pages[pageIndex.coerceIn(0, pages.lastIndex)]
    val childName = fields["nickname"].orEmpty()

    if (completed) {
        MealCheckInHome(onStart = { onOpenMealCheckIn(false) }, onResume = { onOpenMealCheckIn(true) }, hasDraft = hasMealDraft)
        return
    }
    if (paused) {
        FullScreenMessage("Saved for later", "Your answers are saved. Continue whenever you are ready.", "Resume onboarding", onAction = { paused = false })
        return
    }
    if (tutorialPage >= 0) {
        val tutorialTitles = listOf("Log a meal", "Notice reactions", "Choose a next step")
        val descriptions = listOf("Capture what was served and the form it was offered in.", "Record what your child ate, explored, or avoided.", "Use the history to choose one small change for next time.")
        FullScreenMessage(
            title = "${T("Example")} · ${T(tutorialTitles[tutorialPage])}",
            message = descriptions[tutorialPage],
            action = if (tutorialPage == 2) "Log first meal" else "Next",
            onAction = { if (tutorialPage == 2) { tutorialPage = -1; completed = true } else tutorialPage++ },
            onSkip = { tutorialPage = -1; completed = true },
            onBack = if (tutorialPage > 0) ({ tutorialPage-- }) else null,
            secondaryAction = if (tutorialPage == 2) "Go to Home" else null,
            onSecondaryAction = { tutorialPage = -1; completed = true },
        )
        return
    }

    val selectedOnPage = selected[page.key].orEmpty()
    val otherChoice = page.choices.firstOrNull { it == "Other" || it.startsWith("Other ") }
    val otherQueryKey = "other_query_${page.key}"
    val otherQuery = fields[otherQueryKey].orEmpty()
    val showOther = otherChoice != null && (otherChoice in selectedOnPage || selectedOnPage.any { it !in page.choices })
    val scrollState = rememberScrollState()
    val imeBottom = WindowInsets.ime.getBottom(LocalDensity.current)
    LaunchedEffect(pageIndex) { scrollState.scrollTo(0) }
    LaunchedEffect(page.key, otherQuery, showOther) {
        viewModel.searchCatalog(page.key, if (showOther && page.key in 5..8) otherQuery else "")
    }
    LaunchedEffect(page.key, showOther, otherQuery, savedState.catalogResults, showSafeFoodCard, imeBottom) {
        if (showOther || (page.number == 16 && showSafeFoodCard)) {
            withFrameNanos { }
            scrollState.animateScrollTo(scrollState.maxValue)
        }
    }
    Column(
        modifier = Modifier.fillMaxSize().background(Canvas).windowInsetsPadding(WindowInsets.statusBars).imePadding()
    ) {
        Column(modifier = Modifier.weight(1f).verticalScroll(scrollState).padding(horizontal = 20.dp)) {
            OnboardingProgress(pageIndex + 1, pages.size, saved = !savedState.isSaving && !savedState.saveFailed)
            Spacer(Modifier.height(10.dp))
            Text(T(page.title, childName), color = Ink, fontSize = 20.sp, lineHeight = 23.sp, fontWeight = FontWeight.Bold)
            if (page.subtitle.isNotBlank()) Text(T(page.subtitle, childName), color = Muted, fontSize = 10.sp, lineHeight = 14.sp, modifier = Modifier.padding(top = 3.dp))
            Spacer(Modifier.height(12.dp))
            when (page.number) {
                1 -> AccountContent(fields) { key, value -> fields = fields + (key to value) }
                2 -> ConsentContent(selectedOnPage) { choice -> selected = selected + (2 to toggleSelection(selectedOnPage, choice, null, true)) }
                4 -> ChildContent(fields) { key, value -> fields = fields + (key to value) }
                16 -> SafeFoodsContent(
                    safeFoods, safeFoodDraft, safePreparation, safePresentation, showSafeFoodCard, noSafeFoods, childName,
                    onOpen = { showSafeFoodCard = true; noSafeFoods = false },
                    onName = { safeFoodDraft = it }, onPreparation = { safePreparation = it }, onPresentation = { safePresentation = it },
                    onNoFoods = { noSafeFoods = it; if (it) safeFoods = emptyList() },
                    onAdd = { if (safeFoodDraft.isNotBlank() && safePreparation.isNotBlank()) {
                        safeFoods = safeFoods + listOf(safeFoodDraft.trim(), safePreparation.trim(), safePresentation.trim()).filter(String::isNotBlank).joinToString(" · ")
                        safeFoodDraft = ""; safePreparation = ""; safePresentation = ""; showSafeFoodCard = false; noSafeFoods = false
                    } }, onRemove = { safeFoods = safeFoods - it },
                    onSaveAndExit = {
                        val draftFields = fields + mapOf("safeFoodDraft" to safeFoodDraft, "safePreparation" to safePreparation, "safePresentation" to safePresentation)
                        val draftChoices = if (noSafeFoods) selected + (16 to setOf("No safe foods yet")) else selected - 16
                        viewModel.save(com.mca.myapplication.data.OnboardingDraft(pageIndex, draftFields, draftChoices, safeFoods))
                        paused = true
                    })
                17 -> ReviewContent(fields, selected, safeFoods, onEdit = { target -> pageIndex = target })
                else -> SelectionContent(
                    page = page,
                    selected = selectedOnPage,
                    childName = childName,
                    otherQuery = otherQuery,
                    onOtherQueryChange = { fields = fields + (otherQueryKey to it) },
                    catalogResults = if (savedState.catalogPage == page.key) savedState.catalogResults else emptyList(),
                    onSelectAll = { selected = selected + (page.key to if (page.choices.all { it in selectedOnPage }) emptySet() else page.choices.toSet()) },
                    onToggle = { choice -> selected = selected + (page.key to toggleSelection(selectedOnPage, choice, page.exclusive, page.multiSelect)) },
                )
            }
        }
        val canContinue = when (page.number) {
            1 -> fields["name"].orEmpty().isNotBlank() && fields["email"].orEmpty().contains("@") && fields["password"].orEmpty().length >= 8
            2 -> "Account and care privacy" in selectedOnPage && "Photo analysis and personalization" in selectedOnPage
            4 -> fields["nickname"].orEmpty().isNotBlank() && fields["age"].orEmpty().isNotBlank()
            5, 6 -> selectedOnPage.isNotEmpty()
            16 -> safeFoods.isNotEmpty() || noSafeFoods
            8 -> selectedOnPage.isNotEmpty()
            else -> true
        }
        OnboardingNavigationBar(
            primaryLabel = if (page.number == 17) "Looks good" else "Continue",
            onPrevious = { pageIndex = (pageIndex - 1).coerceAtLeast(0) },
            onContinue = {
                val draftFields = fields + mapOf("safeFoodDraft" to safeFoodDraft, "safePreparation" to safePreparation, "safePresentation" to safePresentation)
                val draftChoices = if (noSafeFoods) selected + (16 to setOf("No safe foods yet")) else selected - 16
                val currentDraft = com.mca.myapplication.data.OnboardingDraft(pageIndex, draftFields, draftChoices, safeFoods)
                if (page.number == 17) { viewModel.complete(currentDraft); return@OnboardingNavigationBar }
                else pageIndex = (pageIndex + 1).coerceAtMost(pages.lastIndex)
            }, enabled = canContinue
        )
    }
}

private fun toggleSelection(current: Set<String>, value: String, exclusive: String?, multi: Boolean): Set<String> {
    if (!multi) return if (value in current) emptySet() else setOf(value)
    if (value == exclusive) return if (value in current) emptySet() else setOf(value)
    return if (value in current) current - value else (current - (exclusive ?: "")) + value
}

@Composable
private fun AccountContent(values: Map<String, String>, onChange: (String, String) -> Unit) {
    FormFieldLabel("PARENT OR CAREGIVER FULL NAME")
    NurtureTextField("Name", values["name"].orEmpty()) { onChange("name", it) }
    FormFieldLabel("EMAIL", modifier = Modifier.padding(top = 10.dp))
    NurtureTextField("Email", values["email"].orEmpty()) { onChange("email", it) }
    FormFieldLabel("PASSWORD", modifier = Modifier.padding(top = 10.dp))
    val password = values["password"].orEmpty()
    val isTooShort = password.isNotEmpty() && password.length < 8
    NurtureTextField("Password", password, visualTransformation = PasswordVisualTransformation(), isError = isTooShort) { onChange("password", it) }
    Text(T(if (isTooShort) "Password is too short. Please enter at least 8 characters." else "Use at least 8 characters"), color = if (isTooShort) OnboardingColors.Red else Muted, fontSize = 9.sp, modifier = Modifier.padding(top = 3.dp))
}

@Composable
private fun ChildContent(values: Map<String, String>, onChange: (String, String) -> Unit) {
    FormFieldLabel("NICKNAME")
    NurtureTextField("Child’s nickname", values["nickname"].orEmpty()) { onChange("nickname", it) }
    Text(T("Use any name your family is comfortable with."), color = Muted, fontSize = 9.sp, modifier = Modifier.padding(top = 4.dp))
    FormFieldLabel("AGE RANGE", modifier = Modifier.padding(top = 12.dp))
    SelectionContent(page = OnboardingPage(4, "", "", "", "", listOf("Under 2 years", "2–3 years", "4–5 years", "6–8 years", "9–12 years", "13+ years"), false), selected = setOfNotNull(values["age"]), onToggle = { onChange("age", it) })
    InfoBanner("We ask for an age range, not an exact birth date, to reduce unnecessary personal data.", Modifier.padding(top = 8.dp))
}

@Composable
private fun ConsentContent(selected: Set<String>, onToggle: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(T("Consent to Collection and Use of Personal Information"), color = Ink, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Text(T("Required checks must be completed before continuing."), color = Muted, fontSize = 9.sp)
        listOf("Account and care privacy", "Photo analysis and personalization", "AI training and model research").forEachIndexed { index, label ->
            Surface(shape = RoundedCornerShape(9.dp), color = if (label in selected) SoftBlue else Color.White, border = BorderStroke(1.dp, if (label in selected) Blue else Line), modifier = Modifier.fillMaxWidth().clickable { onToggle(label) }) {
                Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.Top) {
                    Surface(color = if (label in selected) Blue else Color.White, shape = RoundedCornerShape(5.dp), border = BorderStroke(1.dp, if (label in selected) Blue else Line), modifier = Modifier.size(20.dp)) {
                        Box(contentAlignment = Alignment.Center) { if (label in selected) FigmaIcon(R.drawable.ic_figma_check, size = 12.dp, tint = Color.White) }
                    }
                    Column(Modifier.padding(start = 8.dp).weight(1f)) {
                        Text(T(label), color = Ink, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        Text(T(if (index == 0) "Required · account and care information" else if (index == 1) "Required · photo analysis and personalization" else "Optional · help improve future models"), color = Muted, fontSize = 9.sp, lineHeight = 12.sp, modifier = Modifier.padding(top = 4.dp))
                    }
                    Text(T(if (index < 2) "REQUIRED" else "OPTIONAL"), color = Blue, fontSize = 7.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
    Spacer(Modifier.height(10.dp))
    InfoBanner("Safety and recommendation limits\nThe app does not diagnose conditions or replace medical advice. Always check labels and allergen declarations.", Modifier.padding(top = 8.dp))
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SelectionContent(
    page: OnboardingPage,
    selected: Set<String>,
    childName: String = "",
    otherQuery: String = "",
    onOtherQueryChange: (String) -> Unit = {},
    catalogResults: List<String> = emptyList(),
    onSelectAll: () -> Unit = {},
    onToggle: (String) -> Unit,
) {
    if (page.section.isNotBlank()) Text(T(page.section, childName), color = Ink, fontSize = 11.sp, lineHeight = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 6.dp))
    if (page.description.isNotBlank()) Text(T(page.description, childName), color = Muted, fontSize = 9.sp, lineHeight = 12.sp, modifier = Modifier.padding(bottom = 7.dp))
    if (page.key == 7) SelectionOption("All", page.choices.all { it in selected }, onClick = onSelectAll)
    Column(verticalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.padding(top = if (page.key == 7) 5.dp else 0.dp)) {
        page.choices.forEach { choice -> SelectionOption(choice, choice in selected, onClick = { onToggle(choice) }) }
    }
    val otherChoice = page.choices.firstOrNull { it == "Other" || it.startsWith("Other ") }
    val addedItems = selected.filter { it !in page.choices }
    if (otherChoice != null && (otherChoice in selected || addedItems.isNotEmpty())) {
        val placeholder = when (page.key) {
            5 -> "Type an allergy or ingredient"
            6 -> "Type a restriction"
            8 -> "Type a dietary approach"
            11 -> "Type a texture"
            120 -> "Type a taste"
            13 -> "Type a presentation"
            else -> "Type a food or category"
        }
        FormFieldLabel(if (page.key == 5) "OTHER ALLERGY" else "OTHER", modifier = Modifier.padding(top = 11.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            NurtureTextField(placeholder, otherQuery, Modifier.weight(1f), onValueChange = onOtherQueryChange)
            Spacer(Modifier.width(6.dp))
            CompactAddButton(onClick = {
                val value = otherQuery.trim()
                if (value.isNotEmpty() && value !in selected) onToggle(value)
                onOtherQueryChange("")
            }, enabled = otherQuery.isNotBlank())
        }
        if (page.key in 5..8 && otherQuery.isNotBlank()) {
            val visibleResults = catalogResults.filterNot { it in selected }
            Surface(color = Color.White, shape = RoundedCornerShape(9.dp), border = BorderStroke(1.dp, Line), modifier = Modifier.fillMaxWidth().padding(top = 3.dp)) {
                Column {
                    if (visibleResults.isEmpty()) Text(T("No results"), color = Muted, fontSize = 9.sp, modifier = Modifier.padding(9.dp))
                    visibleResults.forEach { result ->
                        Text(T(result), color = Ink, fontSize = 10.sp, modifier = Modifier.fillMaxWidth().clickable { onToggle(result); onOtherQueryChange("") }.padding(horizontal = 10.dp, vertical = 8.dp))
                    }
                }
            }
        }
        if (addedItems.isNotEmpty()) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 6.dp)) {
                addedItems.forEach { item -> RemovableToken(item, onRemove = { onToggle(item) }) }
            }
        }
        Text(T("Add one item at a time."), color = Muted, fontSize = 8.sp, modifier = Modifier.padding(top = 4.dp))
    }
    if (page.number == 5 || page.number == 6) InfoBanner(if (page.number == 5) "Safety-critical\nCheck ingredient labels and cross-contact. Recommendations pause when allergy details are unknown." else "We use these safety details when checking future food suggestions.", Modifier.padding(top = 8.dp))
    if (page.number in 11..14 || page.number == 15) Text(T(if (page.multiSelect) "Multiple selections allowed" else "Single selection"), color = Muted, fontSize = 8.sp, modifier = Modifier.fillMaxWidth().padding(top = 4.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SafeFoodsContent(items: List<String>, draft: String, preparation: String, presentation: String, showCard: Boolean, noFoods: Boolean, childName: String, onOpen: () -> Unit, onName: (String) -> Unit, onPreparation: (String) -> Unit, onPresentation: (String) -> Unit, onNoFoods: (Boolean) -> Unit, onAdd: () -> Unit, onRemove: (String) -> Unit, onSaveAndExit: () -> Unit) {
    Text(T("SAFE FOODS"), color = Ink, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    Text(T("Foods {child} reliably accepts in a familiar form.", childName), color = Muted, fontSize = 9.sp, modifier = Modifier.padding(top = 3.dp, bottom = 9.dp))
    Row(verticalAlignment = Alignment.CenterVertically) {
        NurtureTextField("Add a familiar food", draft, Modifier.weight(1f), onValueChange = onName)
        Spacer(Modifier.width(6.dp))
        SquarePlusButton(onOpen)
    }
    Spacer(Modifier.height(7.dp))
    if (showCard) {
        Surface(shape = RoundedCornerShape(10.dp), color = Color.White, border = BorderStroke(1.dp, Line), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Column(Modifier.padding(10.dp)) {
                Text(T("Add safe food"), color = Ink, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                FormFieldLabel("FOOD NAME", Modifier.padding(top = 6.dp))
                NurtureTextField("Food name", draft, onValueChange = onName)
                FormFieldLabel("PREPARATION", Modifier.padding(top = 6.dp))
                NurtureTextField("Preparation", preparation, onValueChange = onPreparation)
                FormFieldLabel("PRESENTATION NOTE · OPTIONAL", Modifier.padding(top = 6.dp))
                NurtureTextField("Optional serving note", presentation, onValueChange = onPresentation)
                PrimaryActionButton("Add", onAdd, Modifier.fillMaxWidth().padding(top = 6.dp), enabled = draft.isNotBlank() && preparation.isNotBlank())
            }
        }
    }
    if (items.isEmpty() && !showCard) SelectionOption("No safe foods yet", noFoods, onClick = { onNoFoods(!noFoods) })
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 6.dp)) {
        items.forEach { item -> RemovableToken(item, onRemove = { onRemove(item) }) }
    }
    TextButton(onClick = onSaveAndExit, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) { Text(T("Save & exit"), color = Blue, fontSize = 11.sp) }
}

@Composable
private fun ReviewContent(values: Map<String, String>, selected: Map<Int, Set<String>>, foods: List<String>, onEdit: (Int) -> Unit) {
    val isKorean = LocalConfiguration.current.locales[0].language == "ko"
    val nickname = values["nickname"].orEmpty()
    val tr: (String) -> String = { OnboardingStrings.translate(it, isKorean, nickname) }
    val summary: (Int) -> String = { key -> selected[key].orEmpty().joinToString { tr(it) }.ifBlank { tr("Not specified") } }
    val summaries = listOf(
        "Safety restrictions" to "${tr("Allergies:")} ${summary(5)}",
        "Family practices" to summary(7),
        "Dietary approaches" to summary(8),
        "Sensory tendencies" to ((selected[11].orEmpty() + selected[12].orEmpty() + selected[120].orEmpty() + selected[13].orEmpty() + selected[14].orEmpty()).joinToString { tr(it) }.ifBlank { tr("Not specified") }),
        "Safe foods" to foods.joinToString().ifBlank { tr("None added") },
        "Child basics" to "$nickname · ${tr(values["age"].orEmpty())}".trim(' ', '·'),
        "Other dietary restrictions" to summary(6),
        "Presentation" to summary(13),
        "Serving temperature" to summary(14),
        "Taste intensity" to summary(120),
        "Food smell" to summary(12),
        "New-food familiarity" to summary(15),
    )
    val targetSteps = listOf(3, 5, 6, 7, 13, 2, 4, 10, 11, 9, 8, 12)
    summaries.forEachIndexed { index, (title, summary) ->
        Surface(shape = RoundedCornerShape(8.dp), color = Color.White, border = BorderStroke(1.dp, Line), modifier = Modifier.fillMaxWidth().padding(bottom = 5.dp).clickable { onEdit(targetSteps[index]) }) {
            Row(Modifier.padding(horizontal = 9.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(tr(title), color = Ink, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    Text(summary, color = Muted, fontSize = 8.sp, maxLines = 1)
                }
                FigmaIcon(R.drawable.ic_figma_chevron_right, size = 14.dp)
            }
        }
    }
}

@Composable
private fun FullScreenMessage(
    title: String,
    message: String,
    action: String,
    onAction: () -> Unit,
    onSkip: (() -> Unit)? = null,
    onBack: (() -> Unit)? = null,
    secondaryAction: String? = null,
    onSecondaryAction: () -> Unit = {},
) {
    Column(Modifier.fillMaxSize().background(Canvas).windowInsetsPadding(WindowInsets.statusBars).padding(horizontal = 30.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        if (onBack != null) Row(modifier = Modifier.align(Alignment.Start).clickable { onBack() }.padding(bottom = 18.dp), verticalAlignment = Alignment.CenterVertically) {
            FigmaIcon(R.drawable.ic_figma_back, size = 18.dp, tint = Blue)
            Text(T("Back"), color = Blue, fontSize = 11.sp, modifier = Modifier.padding(start = 4.dp))
        }
        Text(T(title), color = Ink, fontSize = 24.sp, lineHeight = 28.sp, fontWeight = FontWeight.Bold, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Text(T(message), color = Muted, fontSize = 11.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center, modifier = Modifier.padding(top = 12.dp, bottom = 18.dp))
        PrimaryActionButton(action, onAction, Modifier.fillMaxWidth())
        if (secondaryAction != null) Text(T(secondaryAction), color = Blue, fontSize = 10.sp, modifier = Modifier.padding(top = 12.dp).clickable { onSecondaryAction() })
        if (onSkip != null) Text(T("Skip tutorial"), color = Blue, fontSize = 10.sp, modifier = Modifier.padding(top = 12.dp).clickable { onSkip() })
    }
}
