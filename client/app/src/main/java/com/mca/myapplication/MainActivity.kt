package com.mca.myapplication

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.ViewModelProvider
import com.mca.myapplication.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val onboardingViewModel = ViewModelProvider(this, OnboardingViewModel.Factory(applicationContext))[OnboardingViewModel::class.java]
        setContent { MyApplicationTheme { OnboardingApp(onboardingViewModel) } }
    }
}
