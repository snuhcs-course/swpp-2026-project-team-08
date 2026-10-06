package com.mca.myapplication.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** Vector drawables converted from the matching icon nodes in the Figma file. */
@Composable
fun FigmaIcon(@DrawableRes icon: Int, modifier: Modifier = Modifier, size: Dp = 18.dp, tint: Color = Color.Unspecified, description: String? = null) {
    Icon(painter = painterResource(icon), contentDescription = description, modifier = modifier.size(size), tint = tint)
}
