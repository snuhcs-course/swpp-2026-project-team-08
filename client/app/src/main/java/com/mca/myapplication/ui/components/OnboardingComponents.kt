package com.mca.myapplication.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mca.myapplication.OnboardingStrings
import com.mca.myapplication.R
import com.mca.myapplication.ui.theme.OnboardingColors

@Composable
fun OnboardingProgress(currentStep: Int, totalSteps: Int, modifier: Modifier = Modifier, saved: Boolean = true) {
    Row(modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(OnboardingStrings.step(currentStep, totalSteps), color = OnboardingColors.Blue, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (saved) FigmaIcon(R.drawable.ic_figma_cloud_check, size = 13.dp)
            Text(OnboardingStrings.display(if (saved) "Auto-saved" else "Saving…"), color = if (saved) OnboardingColors.Green else OnboardingColors.Muted, fontSize = 9.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(start = 4.dp))
        }
    }
    Spacer(Modifier.height(8.dp))
    Box(Modifier.fillMaxWidth().height(3.dp).background(OnboardingColors.Line, RoundedCornerShape(4.dp))) {
        Box(Modifier.fillMaxWidth((currentStep.toFloat() / totalSteps).coerceIn(0.03f, 1f)).height(3.dp).background(OnboardingColors.Blue, RoundedCornerShape(4.dp)))
    }
}

/** A text field with enough vertical space for Material's input and label typography. */
@Composable
fun NurtureTextField(
    placeholder: String,
    value: String,
    modifier: Modifier = Modifier,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    isError: Boolean = false,
    onValueChange: (String) -> Unit,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth().heightIn(min = 56.dp),
        singleLine = true,
        shape = RoundedCornerShape(9.dp),
        placeholder = { Text(OnboardingStrings.display(placeholder), fontSize = 10.sp, color = OnboardingColors.Muted) },
        visualTransformation = visualTransformation,
        isError = isError,
        textStyle = TextStyle(color = Color.Black, fontSize = 13.sp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.Black,
            unfocusedTextColor = Color.Black,
            errorTextColor = Color.Black,
            focusedBorderColor = OnboardingColors.Blue,
            unfocusedBorderColor = OnboardingColors.Line,
            errorBorderColor = OnboardingColors.Red,
        ),
    )
}

@Composable
fun FormFieldLabel(text: String, modifier: Modifier = Modifier) {
    Text(OnboardingStrings.display(text), color = OnboardingColors.Ink, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = modifier.padding(bottom = 4.dp))
}

@Composable
fun SelectionOption(text: String, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = if (selected) OnboardingColors.SoftBlue else Color.White,
        border = BorderStroke(1.dp, if (selected) OnboardingColors.Blue else OnboardingColors.Line),
        modifier = modifier.fillMaxWidth().heightIn(min = 40.dp).clickable(onClick = onClick),
    ) {
        Row(Modifier.padding(horizontal = 8.dp, vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(OnboardingStrings.display(text), color = OnboardingColors.Ink, fontSize = 10.sp, modifier = Modifier.weight(1f))
            Surface(color = if (selected) OnboardingColors.Blue else Color.White, shape = RoundedCornerShape(5.dp), border = BorderStroke(1.dp, if (selected) OnboardingColors.Blue else OnboardingColors.Line), modifier = Modifier.size(20.dp)) {
                Box(contentAlignment = Alignment.Center) { if (selected) FigmaIcon(R.drawable.ic_figma_check, size = 12.dp, tint = Color.White) }
            }
        }
    }
}

@Composable
fun InfoBanner(text: String, modifier: Modifier = Modifier) {
    Surface(color = OnboardingColors.Banner, shape = RoundedCornerShape(9.dp), modifier = modifier.fillMaxWidth()) {
        Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.Top) {
            FigmaIcon(R.drawable.ic_figma_info, size = 13.dp)
            Text(OnboardingStrings.display(text), color = OnboardingColors.Ink, fontSize = 9.sp, lineHeight = 12.sp, modifier = Modifier.padding(start = 6.dp))
        }
    }
}

@Composable
fun OnboardingNavigationBar(
    primaryLabel: String,
    onPrevious: () -> Unit,
    onContinue: () -> Unit,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
) {
    Surface(color = Color.White, shape = RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp), shadowElevation = 10.dp, modifier = modifier) {
        Row(Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.navigationBars).padding(horizontal = 18.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SecondaryActionButton("Previous", onPrevious, Modifier.weight(0.32f), height = 44.dp)
            PrimaryActionButton(primaryLabel, onContinue, Modifier.weight(0.68f), enabled = enabled, height = 44.dp)
        }
    }
}

@Composable
fun PrimaryActionButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, height: androidx.compose.ui.unit.Dp = 46.dp) {
    Button(onClick = onClick, enabled = enabled, modifier = modifier.height(height), shape = RoundedCornerShape(10.dp), colors = ButtonDefaults.buttonColors(containerColor = OnboardingColors.Blue)) {
        Text(OnboardingStrings.display(label), fontSize = 12.sp, color = Color.White)
    }
}

@Composable
fun SecondaryActionButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier, height: androidx.compose.ui.unit.Dp = 46.dp) {
    Button(onClick = onClick, modifier = modifier.height(height), shape = RoundedCornerShape(10.dp), colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = OnboardingColors.Ink), border = BorderStroke(1.dp, OnboardingColors.Line)) {
        Text(OnboardingStrings.display(label), fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun CompactAddButton(onClick: () -> Unit, enabled: Boolean, modifier: Modifier = Modifier) {
    Surface(color = if (enabled) OnboardingColors.Blue else OnboardingColors.Line, shape = RoundedCornerShape(9.dp), modifier = modifier.width(64.dp).height(46.dp).clickable(enabled = enabled, onClick = onClick)) {
        Row(horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
            FigmaIcon(R.drawable.ic_figma_plus, size = 12.dp, tint = Color.White)
            Text(OnboardingStrings.display("Add"), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 3.dp))
        }
    }
}

@Composable
fun SquarePlusButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(color = OnboardingColors.Blue, shape = RoundedCornerShape(9.dp), modifier = modifier.size(width = 40.dp, height = 46.dp).clickable(onClick = onClick)) {
        Box(contentAlignment = Alignment.Center) { FigmaIcon(R.drawable.ic_figma_plus, size = 17.dp, tint = Color.White) }
    }
}

@Composable
fun RemovableToken(label: String, onRemove: () -> Unit, modifier: Modifier = Modifier) {
    Surface(color = OnboardingColors.GreenSoft, shape = RoundedCornerShape(999.dp), border = BorderStroke(1.dp, OnboardingColors.Green), modifier = modifier.clickable(onClick = onRemove)) {
        Row(Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(OnboardingStrings.display(label), color = OnboardingColors.Ink, fontSize = 9.sp, fontWeight = FontWeight.SemiBold)
            FigmaIcon(R.drawable.ic_figma_close, modifier = Modifier.padding(start = 5.dp), size = 10.dp, tint = OnboardingColors.Ink)
        }
    }
}
