package com.mca.myapplication

import android.content.Context
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mca.myapplication.data.OnboardingDraft
import com.mca.myapplication.data.OnboardingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class OnboardingUiState(
    val draft: OnboardingDraft = OnboardingDraft(),
    val isSaving: Boolean = false,
    val saveFailed: Boolean = false,
    val completed: Boolean = false,
    val isLoaded: Boolean = false,
)

class OnboardingViewModel(
    private val repository: OnboardingRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(OnboardingUiState())
    val state: StateFlow<OnboardingUiState> = mutableState.asStateFlow()

    init {
        viewModelScope.launch {
            val result = repository.loadDraft()
            mutableState.value = mutableState.value.copy(
                draft = result.getOrNull() ?: OnboardingDraft(),
                completed = result.getOrNull()?.completed == true,
                saveFailed = result.isFailure,
                isLoaded = true,
            )
        }
    }

    fun save(draft: OnboardingDraft) {
        mutableState.value = mutableState.value.copy(draft = draft, isSaving = true, saveFailed = false)
        viewModelScope.launch {
            val result = repository.saveDraft(draft)
            mutableState.value = mutableState.value.copy(isSaving = false, saveFailed = result.isFailure)
        }
    }

    fun complete(draft: OnboardingDraft) {
        mutableState.value = mutableState.value.copy(draft = draft, isSaving = true, saveFailed = false)
        viewModelScope.launch {
            val result = repository.complete(draft)
            mutableState.value = mutableState.value.copy(isSaving = false, saveFailed = result.isFailure, completed = result.isSuccess)
        }
    }

    class Factory(context: Context) : ViewModelProvider.Factory {
        private val repository = OnboardingRepository(context.applicationContext)

        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            require(modelClass.isAssignableFrom(OnboardingViewModel::class.java))
            return OnboardingViewModel(repository) as T
        }
    }
}
