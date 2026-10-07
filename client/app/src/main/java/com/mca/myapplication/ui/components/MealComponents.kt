package com.mca.myapplication.ui.components

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mca.myapplication.ui.components.FigmaIcon
import com.mca.myapplication.ui.theme.MealBlue
import com.mca.myapplication.ui.theme.MealBorder
import com.mca.myapplication.ui.theme.MealCanvas
import com.mca.myapplication.ui.theme.MealMuted
import com.mca.myapplication.ui.theme.MealNavy
import com.mca.myapplication.ui.theme.MealSoftBlue
import com.mca.myapplication.ui.theme.MealDestructiveInk
import com.mca.myapplication.ui.theme.MealDestructiveBorder
import com.mca.myapplication.ui.theme.MealDestructiveSoft
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

import com.mca.myapplication.MealCheckInTexts
import com.mca.myapplication.R

@Composable
internal fun FullPhotoScreen(photoPath: String, onBack: () -> Unit) {
    val s = MealCheckInTexts.current
    Column(Modifier.fillMaxSize().background(MealCanvas).windowInsetsPadding(WindowInsets.statusBars).windowInsetsPadding(WindowInsets.navigationBars)) {
        Surface(color = androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(999.dp), border = BorderStroke(1.dp, MealBlue), modifier = Modifier.padding(start = 24.dp, top = 13.dp).clickable(onClick = onBack)) {
            Row(Modifier.padding(horizontal = 12.dp, vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
                FigmaIcon(R.drawable.ic_figma_back, size = 18.dp, tint = MealNavy)
                Text(s.goBack, color = MealNavy, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 7.dp))
            }
        }
        Box(Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp), contentAlignment = Alignment.Center) {
            PhotoImage(photoPath, Modifier.fillMaxSize().clip(RoundedCornerShape(24.dp)), ContentScale.Fit)
        }
        Spacer(Modifier.height(76.dp))
    }
}

@Composable
internal fun MealPrimaryButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, height: androidx.compose.ui.unit.Dp = 52.dp, leadingIcon: Int? = null) {
    Button(onClick = onClick, enabled = enabled, modifier = modifier.fillMaxWidth().height(height), shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.buttonColors(containerColor = MealBlue)) {
        if (leadingIcon != null) {
            FigmaIcon(leadingIcon, size = 17.dp, tint = androidx.compose.ui.graphics.Color.White)
            Spacer(Modifier.width(8.dp))
        }
        Text(label, color = androidx.compose.ui.graphics.Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
internal fun MealSecondaryButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier, compact: Boolean = false, destructive: Boolean = false, leadingIcon: Int? = null) {
    val color = if (destructive) MealDestructiveInk else MealBlue
    Button(onClick = onClick, modifier = modifier.height(if (compact) 34.dp else 52.dp), shape = RoundedCornerShape(if (compact) 10.dp else 14.dp), border = BorderStroke(1.dp, if (destructive) MealDestructiveBorder else MealBorder), colors = ButtonDefaults.buttonColors(containerColor = if (destructive) MealDestructiveSoft else androidx.compose.ui.graphics.Color.White, contentColor = color)) {
        if (leadingIcon != null) {
            FigmaIcon(leadingIcon, size = if (compact) 14.dp else 17.dp, tint = color)
            Spacer(Modifier.width(6.dp))
        }
        Text(label, color = color, fontSize = if (compact) 10.sp else 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
internal fun PhotoImage(path: String, modifier: Modifier = Modifier, scale: ContentScale = ContentScale.Crop) {
    val bitmap by produceState<Bitmap?>(initialValue = null, path) {
        value = withContext(Dispatchers.IO) {
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(path, bounds)
            var sampleSize = 1
            while (bounds.outWidth / sampleSize > 1600 || bounds.outHeight / sampleSize > 1600) sampleSize *= 2
            BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inSampleSize = sampleSize })
        }
    }
    if (bitmap != null) Image(bitmap!!.asImageBitmap(), contentDescription = null, contentScale = scale, modifier = modifier)
    else Box(modifier.background(MealSoftBlue), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = MealBlue, modifier = Modifier.size(28.dp)) }
}

@Composable
internal fun ChoiceAction(title: String, icon: Int, onClick: () -> Unit, modifier: Modifier = Modifier, detail: String? = null) {
    Surface(color = androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, MealBorder), modifier = modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.padding(horizontal = 14.dp, vertical = if (detail == null) 12.dp else 9.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(36.dp).background(MealSoftBlue, RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) { FigmaIcon(icon, size = 18.dp, tint = MealBlue) }
            Column(Modifier.weight(1f).padding(start = 12.dp)) {
                Text(title, color = MealNavy, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                if (detail != null) Text(detail, color = MealMuted, fontSize = 9.sp, modifier = Modifier.padding(top = 2.dp))
            }
            FigmaIcon(R.drawable.ic_figma_chevron_right, size = 16.dp)
        }
    }
}

@Composable
internal fun StatusPill(label: String, background: androidx.compose.ui.graphics.Color, foreground: androidx.compose.ui.graphics.Color) {
    Surface(color = background, shape = RoundedCornerShape(999.dp)) { Text(label, color = foreground, fontSize = 8.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp)) }
}

@Composable
internal fun MealTextInput(value: String, onValueChange: (String) -> Unit, placeholder: String, modifier: Modifier = Modifier) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        singleLine = true,
        shape = RoundedCornerShape(10.dp),
        placeholder = { Text(placeholder, fontSize = 11.sp, color = MealMuted) },
        textStyle = TextStyle(color = androidx.compose.ui.graphics.Color.Black, fontSize = 12.sp),
        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = androidx.compose.ui.graphics.Color.Black, unfocusedTextColor = androidx.compose.ui.graphics.Color.Black, focusedBorderColor = MealBlue, unfocusedBorderColor = MealBorder),
    )
}
