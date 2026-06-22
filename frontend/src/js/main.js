import {
    loadMainStudent, loadMainTeacher, loadMainAdmin, loadCourses, loadExercises, loadSubmissions, loadReports, loadDashboard, loadCourseExercises,
    loadCodingExercise, openUserMenu, openLogoutModal, logoutUser, closeLogoutModalController, runCodingTestsController, handleLanguageChange,
    submitCodingExerciseController, loadSubmissionReportController, loadExerciseSubmissions, loadSubmissionFilters, applySubmissionFiltersController,
    searchSubmissionsController, downloadEvaluationPdfController, loadCourseMessagesController, loadChatController, uploadChatFileController,
    initChatConnectionController, cleanupChatController, sendChatMessageController, uploadMultipleChatFilesController, downloadChatAttachmentController,
    deleteChatMessageController, deleteChatAttachmentController, markConversationReadController,loadSubjectRanking,loadMyProfile,saveProfileChanges
    ,loadEditExercise, saveExerciseChanges, saveTestCase, handleToggleLanguage, handleUpdateTestCase, handleDeleteTestCase,handleAddTestCase,handleCancelEdit
    ,showSaveIndicatorController,showNotificationController, loadCreateExercise, handleCreateExercise ,getCreateFormArguments
    ,toggleCreateFormLanguage,addTestCaseToCreateForm,deleteTestCaseFromCreateForm,deleteArgumentFromCreateForm,addArgumentToCreateForm,getCreateFormSelectedLanguages
    ,getCreateFormTestCases,loadDuplicateExerciseModal,closeDuplicateModalController,confirmDuplicateExercise, addEditArgumentToFormController,deleteEditArgumentController,
    getEditFormArguments,handleSaveExerciseWithArguments,moveArgumentUpController,moveArgumentDownController,addCriterionToRubricUIController,removeCriterionFromRubricUIController
    ,clearAllRubricCriteriaUIController,updateRubricCriteriaCountController,getRubricDataFromFormController,saveRubric,exportSubmissionsController,clearFiltersController
    ,closeNotificationsDropdown,handleNotificationClick,updateNotificationsBadge,loadAndRenderNotifications,markAllNotificationsReadController,toggleNotificationsDropdown
    ,initNotifications,markSingleMessageAsReadController,loadCourseStudents,openEnrollStudentModal,confirmEnrollStudent,unenrollStudentController,openUnenrollConfirmModal
    ,confirmUnenrollStudent ,closeUnenrollModalController ,searchStudentsController,searchCoursesController,handleEvaluationModeChangeController,exportCourseStudentsCSVController
    ,confirmDuplicateCourseOffering,duplicateOfferingPrevStep,duplicateOfferingNextStep,handleDuplicateOfferingSelect,handleDuplicateOfferingYearChange,closeDuplicateOfferingModalController
    ,openDuplicateCourseOfferingModal,handleDuplicateOfferingTargetYearChange,changeAcademicYear,removeProfessorAssignmentController,openBulkJsonModal,downloadProfessorsTemplateController
    ,assignProfessorToCourseController,loadCourseProfessors,searchProfessorsTable,openAssignProfessorModal,assignProfessorFromModal,openRemoveProfessorConfirmModal,confirmRemoveProfessor
    ,closeRemoveProfessorModalController,uploadProfessorsExcelController,loadAcademicStructure,openCreateSubjectModalController,createSubjectController,closeSubjectModalController
    ,openEditSubjectModalController,editSubjectController,deleteSubjectController,downloadSubjectsTemplateController,uploadSubjectsExcelController,openCreateAcademicYearModalController
    ,createAcademicYearController,closeAcademicModalController,openEditAcademicYearModalController,updateAcademicYearController,openCreateCourseOfferingModalController,createCourseOfferingController
    ,downloadCourseOfferingsTemplateController,uploadCourseOfferingsExcelController,openDeleteSubjectConfirmModal,closeDeleteSubjectModalController
    ,filterSubjectsTable,filterCourseOfferingsTable,changeAcademicStructureTab,deleteAcademicYearController,confirmDeleteAcademicYear,closeDeleteAcademicYearModalController
    ,filterAcademicYearsTable,closeDeleteCourseOfferingModalController,openDeleteCourseOfferingConfirmModal,confirmDeleteCourseOffering,openEditCourseOfferingModalController
    ,editCourseOfferingController ,closeAdminDuplicateModal,handleAdminDuplicateYearChange,handleAdminDuplicateSelect
    ,adminDuplicateNextStep,adminDuplicatePrevStep,confirmAdminDuplicateCourseOffering,handleAdminDuplicateTargetYearChange,openAdminDuplicateCourseOfferingWithPreselection
    ,loadUserManagement, searchUsersController, filterUsersByRoleController,openCreateUserModalController, createUserController, openEditUserModalController,
    updateUserController, openDeleteUserModalController, deleteUserController,forceUserPasswordChangeController, openUserSessionsModalController,revokeSessionController, 
    revokeAllSessionsController, uploadUsersExcelController,downloadUsersTemplateController,closeUserModal,setStatusFilter,setRoleFilter
    ,closeForcePasswordModalController,confirmForcePasswordController,openForcePasswordModalController,openChangePasswordModalController
    ,closeChangePasswordModalController,forgotPasswordController,confirmChangePasswordController,searchExercisesController
    ,downloadEnrollmentsTemplateController,uploadEnrollmentsWithUsersExcelController,uploadEnrollmentsExcelController,confirmDeleteExerciseController
    ,changeProfessorRoleController,changeSearchTypeController,loadSystemConfig

} from "./controller.js";
let currentArgumentsCache = window.currentArgumentsCache || [];
const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "/login.html";
}

function setActiveMenu(index) {
    const menuItems = document.querySelectorAll(".menu-item");

    menuItems.forEach(i => i.classList.remove("active"));

    if (menuItems[index]) {
        menuItems[index].classList.add("active");
    }
}

/*const needsPasswordChange = localStorage.getItem("password_change_required") === "true";
if (needsPasswordChange) {
    window.location.href = "change-password.html";
    return;
}*/
function initMenuNavigation() {
    const menuItems = document.querySelectorAll(".menu-item");

    menuItems.forEach((item, index) => {
        item.addEventListener("click", () => {
            setActiveMenu(index);

            switch (index) {
                case 0:
                    loadDashboard();
                    break;
                case 1:
                    loadCourses();
                    break;
                case 2:
                    loadExercises();
                    break;
                case 3:
                    loadSubmissions();
                    break;
                case 4:
                    loadReports();
                    break;
                case 5:
                    if (rol === "admin") {
                        loadAcademicStructure();
                    } else {
                        loadDashboard();
                        showNotificationController("No tienes permiso para acceder a esta sección", "error");
                    }
                    break;
                case 6:
                    if (rol === "admin") {
                        loadUserManagement();
                    } else {
                        loadDashboard();
                        showNotificationController("No tienes permiso para acceder a esta sección", "error");
                    }
                    break;
                case 7:   
                    if (rol === "admin") {
                        loadSystemConfig();
                    } else {
                        loadDashboard();
                        showNotificationController("No tienes permiso para acceder a esta sección", "error");
                    }
                    break;
            }
        });
    });
}

const rol = localStorage.getItem("rol");

// Mostrar/ocultar elementos solo para admin
function toggleAdminOnlyElements() {
    const adminOnlyElements = document.querySelectorAll(".admin-only");
    if (rol === "admin") {
        adminOnlyElements.forEach(el => el.style.display = "flex"); // o "block" según el elemento
    } else {
        adminOnlyElements.forEach(el => el.style.display = "none");
    }
}

// Llamar a la función después de que el DOM esté listo
document.addEventListener("DOMContentLoaded", toggleAdminOnlyElements);
// También llamar por si acaso
toggleAdminOnlyElements();

// Menú hamburguesa responsive
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('aside');
const overlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    if (overlay) {
        overlay.classList.toggle('active');
    }
    // Cambiar el icono del botón
    if (menuToggle) {
        menuToggle.textContent = sidebar.classList.contains('open') ? '✕' : '☰';
    }
}

// Evento para abrir/cerrar al hacer clic en el botón
if (menuToggle) {
    menuToggle.addEventListener('click', toggleSidebar);
}

// Cerrar al hacer clic en el overlay (si existe)
if (overlay) {
    overlay.addEventListener('click', toggleSidebar);
}

// Cerrar al hacer clic en un elemento del menú (en móvil)
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 595 && sidebar && sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    });
});

initMenuNavigation();

// Inicializar WebSocket al cargar la página
initChatConnectionController();

// Inicializar notificaciones (esto debe ir después de inicializar el WebSocket)
initNotifications();
// Limpiar conexión al salir
window.addEventListener("beforeunload", () => {
    cleanupChatController();
});

// INPUT BUSCADOR
document.addEventListener("input", (e) => {
    if (e.target.id === "searchInput") 
    {
        clearTimeout(window.searchSubmissionsTimeout);
        window.searchSubmissionsTimeout = setTimeout(() => {
            const searchValue = e.target.value;
            const searchTypeSelect = document.getElementById("searchTypeSelect");
            const searchType = searchTypeSelect ? searchTypeSelect.value : currentSearchType;
            searchSubmissionsController(searchValue, searchType);
        }, 100); 
        return;
    }
    if (e.target.classList.contains("test-input-large") || e.target.classList.contains("test-output-large")) 
    {
        const testItem = e.target.closest(".test-case-item");
        if (testItem) {
            const testId = testItem.dataset.testId;
            const exerciseId = document.querySelector(".edit-exercise-page")?.dataset.exerciseId;
            if (testId && exerciseId) {
                const inputValue = testItem.querySelector(".test-input-large")?.value || "";
                const outputValue = testItem.querySelector(".test-output-large")?.value || "";
                const visibleCheckbox = testItem.querySelector(".test-visibility");
                const isVisible = visibleCheckbox ? visibleCheckbox.checked : true;
                
                // Debounce para evitar muchas peticiones
                if (window._saveTestCaseTimeout) clearTimeout(window._saveTestCaseTimeout);
                window._saveTestCaseTimeout = setTimeout(async () => {
                    const result = await handleUpdateTestCase(exerciseId, testId, inputValue, outputValue, isVisible);
                    if (result.success) {
                        showSaveIndicatorController(testItem);
                    }
                }, 800);
            }
        }
    }
    // BUSCADOR DE CURSOS 
    if (e.target.id === "courseSearchInput") {
        searchCoursesController(e.target.value);
        return;
    }
    
    // BUSCADOR DE ESTUDIANTES 
    if (e.target.id === "studentsSearchInput") {
        searchStudentsController(e.target.value);
        return;
    }
    // BUSCADOR DE PROFESORES
    if (e.target.id === "professorsSearchInput") {
        searchProfessorsTable(e.target.value);
        return;
    }
    // BUSCADOR DE ASIGNATURAS (Subjects)
    if (e.target.id === "subjectsSearchInput") {
        filterSubjectsTable(e.target.value);
        return;
    }
     
    // BUSCADOR DE COURSE OFFERINGS
    if (e.target.id === "offeringsSearchInput") {
        filterCourseOfferingsTable(e.target.value);
        return;
    }
    // BUSCADOR DE AÑOS ACADÉMICOS
    if (e.target.id === "yearsSearchInput") {
        filterAcademicYearsTable(e.target.value);
        return;
    }
    // Búsqueda en tiempo real de usuarios
    if (e.target.id === "userSearchInput") 
    {
        searchUsersController(e.target.value);
        return;
    }
    // BUSCADOR DE EJERCICIOS
    if (e.target.id === "exerciseSearchInput") 
    {
        searchExercisesController(e.target.value);
        return;
    }
    
});

// CHANGE LANGUAGE Y CHAT FILE SELECT
document.addEventListener("change", (e) => {
    if (e.target.id === "searchTypeSelect") 
    {
        const newType = e.target.value;
        changeSearchTypeController(newType);
        return;
    }
    if (e.target.id === "submissionAcademicYearSelect") 
    {
        const academicYearId = e.target.value;
        loadSubmissions(academicYearId);
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";
        return;
    }
    if (e.target.id === "language-selector")
    {
        const args = window.currentArgumentsCache || [];
        const returnType = window.currentReturnTypeCache || 'any';
        handleLanguageChange(e.target, args, returnType);
    }
    
    // CHAT FILE SELECT - Soporte para múltiples archivos
    if (e.target.classList.contains("chat-file-input")) 
    {
        const files = Array.from(e.target.files);
        if (!files || files.length === 0) return;
        
        const receiverId = e.target.dataset.userid;
        if (files.length === 1) {
            uploadChatFileController(files[0], receiverId);
        } else {
            uploadMultipleChatFilesController(files, receiverId);
        }
        e.target.value = "";
    }
    if (e.target.classList.contains("test-visibility")) 
    {
        const testItem = e.target.closest(".test-case-item");
        if (testItem) {
            const testId = testItem.dataset.testId;
            const exerciseId = document.querySelector(".edit-exercise-page")?.dataset.exerciseId;
            if (testId && exerciseId) {
                const inputValue = testItem.querySelector(".test-input-large")?.value || "";
                const outputValue = testItem.querySelector(".test-output-large")?.value || "";
                const isVisible = e.target.checked;
                
                handleUpdateTestCase(exerciseId, testId, inputValue, outputValue, isVisible).then(result => {
                    if (result.success) {
                        showSaveIndicatorController(testItem);
                    }
                });
            }
        }
    }
    if (e.target.id === "evaluationMode") 
    {
        handleEvaluationModeChangeController();
        return;
    }
    
    // CAMBIO DE AÑO DESTINO EN MODAL
    if (e.target.id === "targetAcademicYearSelect") 
    {
        const targetYearId = e.target.value;
        console.log(targetYearId);
        handleDuplicateOfferingTargetYearChange(targetYearId);
        return;
    }
    // CAMBIO DE AÑO ACADÉMICO EN SELECTOR
    if (e.target.id === "academicYearSelect") {
        const academicYearId = e.target.value;
        console.log(academicYearId);
        changeAcademicYear(academicYearId);
        return;
    }
    // UPLOAD PROFESSORS EXCEL
    if (e.target.id === "uploadProfessorsExcel") 
    {
        const file = e.target.files[0];
        const offeringId = e.target.dataset.offeringId;
        if (file && offeringId) 
        {
            e.target.disabled = true;
            uploadProfessorsExcelController(file, offeringId);
            e.target.disabled = false;
            e.target.value = "";
        }
        return;
    }
    // UPLOAD SUBJECTS EXCEL 
    if (e.target.id === "uploadSubjectsExcel") 
    {
        const file = e.target.files[0];
        if (file) 
        {
            e.target.disabled = true;
            try {
                const result =  uploadSubjectsExcelController(file);
                if (result && result.created_count !== undefined) {
                    showNotificationController(`${result.created_count} subjects created${result.errors?.length ? `, ${result.errors.length} errors` : ''}`, 
                        result.errors?.length ? "warning" : "success");
                }
            } catch (error) {
                console.error("Error uploading subjects excel:", error);
                showNotificationController(error.message || "Error uploading file", "error");
            } finally {
                e.target.disabled = false;
                e.target.value = "";
            }
        }
        return;
    }
    // UPLOAD COURSE OFFERINGS EXCEL
    if (e.target.id === "uploadOfferingsExcel" && e.target.files?.length > 0) 
    {
        const file = e.target.files[0];
        e.target.disabled = true;
        uploadCourseOfferingsExcelController(file);
        e.target.disabled = false;
        e.target.value = "";
        return;
    }
    // UPLOAD USERS EXCEL
    if (e.target.id === "uploadUsersExcel") 
    {
        const file = e.target.files[0];
        if (file) 
        {
            e.target.disabled = true;
            try 
            {
                uploadUsersExcelController(file);
            } 
            catch (error) 
            {
                console.error("Error uploading users excel:", error);
                showNotificationController(error.message || "Error uploading file", "error");
            } 
            finally 
            {
                e.target.disabled = false;
                e.target.value = "";
            }
        }
        return;
    }
    // UPLOAD ENROLLMENTS EXCEL (simple)
    if (e.target.id === "uploadEnrollmentsExcel" && e.target.files?.length > 0) 
    {
        const file = e.target.files[0];
        const offeringId = e.target.dataset.offeringId;
        if (file && offeringId) {
            e.target.disabled = true;
            uploadEnrollmentsExcelController(file, offeringId);
            e.target.disabled = false;
            e.target.value = "";
        }
        return;
    }

    // UPLOAD ENROLLMENTS WITH USERS EXCEL (avanzado)
    if (e.target.id === "uploadEnrollmentsWithUsersExcel" && e.target.files?.length > 0) 
    {
        const file = e.target.files[0];
        const offeringId = e.target.dataset.offeringId;
        if (file && offeringId) {
            e.target.disabled = true;
            uploadEnrollmentsWithUsersExcelController(file, offeringId);
            e.target.disabled = false;
            e.target.value = "";
        }
        return;
    }
});

document.addEventListener("click", async(e) => {
    
    // Botón System Config del dashboard admin
    if (e.target.id === "systemConfigBtn" || e.target.closest("#systemConfigBtn")) 
    {
        e.preventDefault();
        loadSystemConfig();
        return;
    }
    // Botón ADD USER del dashboard admin
    if (e.target.id === "addUserBtn" || e.target.closest("#addUserBtn")) 
    {
        e.preventDefault();
        openCreateUserModalController(true);
        return;
    }
    // Botón NEW COURSE del dashboard admin
    if (e.target.id === "newCourseBtn" || e.target.closest("#newCourseBtn")) {
        e.preventDefault();
        window.__creatingFromDashboard = true;
        openCreateSubjectModalController("dashboard");
        return;
    }
    if (e.target.classList.contains("toggle-role-btn")) 
    {
        e.preventDefault();
        const assignmentId = e.target.dataset.assignmentId;
        const offeringId = e.target.dataset.offeringId;
        const professorName = e.target.dataset.professorName;
        const newIsTutor = e.target.dataset.isTutor === "true";
        changeProfessorRoleController(assignmentId, newIsTutor, offeringId, professorName);
        return;
    }
    if (e.target.classList.contains("delete-exercise-btn")) 
    {
        e.preventDefault();
        const exerciseId = e.target.dataset.id;
        const exerciseTitle = e.target.dataset.title;
        confirmDeleteExerciseController(exerciseId, exerciseTitle);
        return;
    }
    // DOWNLOAD ENROLLMENTS TEMPLATE BUTTON
    if (e.target.id === "downloadEnrollmentsTemplateBtn" || e.target.closest("#downloadEnrollmentsTemplateBtn")) 
    {
        e.preventDefault();
        downloadEnrollmentsTemplateController();
        return;
    }
    // Enviar solicitud de restablecimiento (desde forgot-password.html)
    if (e.target.id === "sendResetLinkBtn") 
    {
        e.preventDefault();
        const email = document.getElementById("forgotEmail")?.value;
        if (!email) {
            showNotificationController("Please enter your email", "error");
            return;
        }
        const btn = e.target;
        btn.disabled = true;
        btn.innerHTML = "Sending...";
        forgotPasswordController(email);
        btn.disabled = false;
        btn.innerHTML = "Send Reset Link";
        return;
    }

    // Reset password (desde reset-password.html)
    if (e.target.id === "resetPasswordBtn") 
    {
        e.preventDefault();
        const newPassword = document.getElementById("newPassword")?.value;
        const confirmPassword = document.getElementById("confirmPassword")?.value;
        if (!newPassword || newPassword.length < 8) {
            showNotificationController("Password must be at least 8 characters", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotificationController("Passwords do not match", "error");
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        if (!token) {
            showNotificationController("Invalid reset token", "error");
            return;
        }
        const btn = e.target;
        btn.disabled = true;
        btn.innerHTML = "Resetting...";
        await resetPasswordController(token, newPassword);
        btn.disabled = false;
        btn.innerHTML = "Reset Password";
        return;
    }

    // Abrir modal de cambio de contraseña (desde perfil)
    if (e.target.id === "changePasswordBtn") 
    {
        e.preventDefault();
        openChangePasswordModalController();
        return;
    }

    // Confirmar cambio de contraseña (desde modal)
    if (e.target.classList.contains("confirm-change-password-btn")) 
    {
        e.preventDefault();
        const currentPassword = document.getElementById("currentPassword")?.value;
        const newPassword = document.getElementById("newPassword")?.value;
        const confirmPassword = document.getElementById("confirmNewPassword")?.value;
        if (!currentPassword || !newPassword) {
            showNotificationController("Please fill all fields", "error");
            return;
        }
        if (newPassword.length < 8) {
            showNotificationController("New password must be at least 8 characters", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotificationController("New passwords do not match", "error");
            return;
        }
        const btn = e.target;
        btn.disabled = true;
        btn.innerHTML = "Updating...";
        confirmChangePasswordController(currentPassword, newPassword);
        btn.disabled = false;
        btn.innerHTML = "Update Password";
        return;
    }

    // Cerrar modal (X o Cancel)
    if (e.target.classList.contains("close-change-password-modal") ||
        e.target.classList.contains("cancel-change-password-btn")) 
    {
        e.preventDefault();
        closeChangePasswordModalController();
        return;
    }
    if (e.target.classList.contains("continue-btn") || e.target.closest(".continue-btn")) 
    {
        const btn = e.target.closest(".continue-btn");
        const exerciseId = btn.dataset.id;
        if (exerciseId) {
            loadCodingExercise(exerciseId, "dashboard");  // ← cambia "exercises" por "dashboard"
        }
        return;
    }
    // Filtro por rol (botones)
    if (e.target.classList.contains('filter-role-btn')) 
    {
        e.preventDefault();
        const role = e.target.dataset.role;
        setRoleFilter(role);
        return;
    }

    // Filtro por estado (botones)
    if (e.target.classList.contains('filter-status-btn')) 
    {
        e.preventDefault();
        const status = e.target.dataset.status;
        setStatusFilter(status);
        return;
    }
    // Abrir modal de crear usuario
    if (e.target.id === "createUserBtn" || e.target.closest("#createUserBtn")) 
    {
        e.preventDefault();
        openCreateUserModalController();
        return;
    }

    if (e.target.id === "confirmCreateUserBtn") 
    {
        e.preventDefault();
        const name = document.getElementById("userName")?.value;
        const email = document.getElementById("userEmail")?.value;
        const password = document.getElementById("userPassword")?.value;
        const role = document.getElementById("userRole")?.value;

        // Detectar si venimos desde el dashboard (por la presencia del botón addUserBtn en el DOM)
        const fromDashboard = !!document.querySelector("#addUserBtn");
        
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Creating...";
        btn.disabled = true;

        await createUserController(email, name, password, role, fromDashboard);

        btn.innerHTML = originalText;
        btn.disabled = false;
        closeUserModal();
        return;
    }
    // Abrir modal de editar usuario
    if (e.target.classList.contains("edit-user-btn")) 
    {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        openEditUserModalController(userId);
        return;
    }

    // Confirmar editar usuario
    if (e.target.id === "confirmEditUserBtn") 
    {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const name = document.getElementById("userName")?.value;
        const email = document.getElementById("userEmail")?.value;
        const role = document.getElementById("userRole")?.value;
    
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Saving...";
        btn.disabled = true;
    
        updateUserController(userId, name, email, role);
    
        btn.innerHTML = originalText;
        btn.disabled = false;
        closeUserModal();
        return;
    }

    // Abrir modal de eliminar usuario
    if (e.target.classList.contains("delete-user-btn")) 
    {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const userName = e.target.dataset.userName;
        openDeleteUserModalController(userId, userName);
        return;
    }

    // Confirmar eliminar usuario
    if (e.target.classList.contains("confirm-delete-user-btn")) 
    {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const userName = e.target.dataset.userName;
    
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Deleting...";
        btn.disabled = true;
    
        deleteUserController(userId, userName);
    
        btn.innerHTML = originalText;
        btn.disabled = false;
        closeUserModal();
        return;
    }

    // Forzar cambio de contraseña 
    if (e.target.classList.contains("force-password-btn")) 
    {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const userName = e.target.dataset.userName;
        openForcePasswordModalController(userId, userName);
        return;
    }
    // Confirmar forzar cambio de contraseña 
    if (e.target.classList.contains("confirm-force-password-btn")) 
    {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const userName = e.target.dataset.userName;
    
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Forzando...";
        btn.disabled = true;
    
        confirmForcePasswordController(userId, userName);
    
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    // Cerrar modal de forzar cambio (X o Cancel)
    if (e.target.classList.contains("close-force-password-modal") || 
    e.target.classList.contains("cancel-force-password-btn")) 
    {
        e.preventDefault();
        closeForcePasswordModalController();
        return;
    }
    // Abrir modal de sesiones
    if (e.target.classList.contains("sessions-btn")) 
    {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const userName = e.target.dataset.userName;
        openUserSessionsModalController(userId, userName);
        return;
    }

    // Revocar sesión individual
    if (e.target.classList.contains("revoke-session-btn")) 
    {
        e.preventDefault();
        const sessionId = e.target.dataset.sessionId;
        const userId = e.target.closest(".sessions-modal")?.querySelector(".revoke-all-sessions-btn")?.dataset.userId;
    
        if (sessionId && userId) 
        {
            revokeSessionController(userId, sessionId);
        }
        return;
    }

    // Revocar todas las sesiones
    if (e.target.classList.contains("revoke-all-sessions-btn")) {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const userName = e.target.dataset.userName;
        revokeAllSessionsController(userId, userName);
        return;
    }
    // Cerrar modal de usuario
    if (e.target.classList.contains("close-user-modal") || 
        e.target.classList.contains("cancel-user-modal-btn")) 
    {
        e.preventDefault();
        closeUserModal();
        return;
    }


    // Filtro por rol
    if (e.target.id === "userRoleFilter") 
    {
        filterUsersByRoleController(e.target.value);
        return;
    }
    // Descargar plantilla Excel
    if (e.target.id === "downloadUsersTemplateBtn" || e.target.closest("#downloadUsersTemplateBtn")) 
    {
        e.preventDefault();
        downloadUsersTemplateController();
        return;
    }
    // Botón DUPLICATE en cada fila de Course Offerings (Admin)
    if (e.target.classList.contains("duplicate-offering-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const offeringId = e.target.dataset.id;
        const subjectName = e.target.dataset.subject;
        const academicYear = e.target.dataset.year;
        if (offeringId) 
        {
            openAdminDuplicateCourseOfferingWithPreselection(offeringId, subjectName, academicYear);
        }
        return;
    }
    // Cerrar modal de admin
    if (e.target.id === "closeAdminDuplicateModalBtn" || e.target.closest("#closeAdminDuplicateModalBtn")) 
    {
        e.preventDefault();
        closeAdminDuplicateModal();
        return;
    }

    // Clic en overlay para cerrar
    if (e.target.id === "adminDuplicateModalOverlay" && e.target === e.currentTarget) 
    {
        closeAdminDuplicateModal();
        return;
    }

    // Selección de año (tabs) - Admin
    if (e.target.classList.contains("admin-duplicate-year-tab")) 
    {
        e.preventDefault();
        const year = e.target.dataset.year;
        handleAdminDuplicateYearChange(year);
        return;
    }

    // Selección de oferta (Admin)
    if (e.target.classList.contains("select-offering-btn") && e.target.closest("#adminOfferingsList")) 
    {
        e.preventDefault();
        const offeringId = parseInt(e.target.dataset.offeringId);
        handleAdminDuplicateSelect(offeringId);
        return;
    }

    // Clic en tarjeta de oferta (Admin)
    if (e.target.closest(".admin-duplicate-offering-card") && !e.target.classList.contains("select-offering-btn")) 
    {
        const card = e.target.closest(".admin-duplicate-offering-card");
        const offeringId = parseInt(card.dataset.offeringId);
        handleAdminDuplicateSelect(offeringId);
        return;
    }

    // Botón Next Step 1 (Admin)
    if (e.target.id === "adminStep1NextBtn") 
    {
        e.preventDefault();
        adminDuplicateNextStep();
        return;
    }

    // Botón Back Step 2 (Admin)
    if (e.target.id === "adminStep2BackBtn") 
    {
        e.preventDefault();
        adminDuplicatePrevStep();
        return;
    }

    // Botón Confirmar Duplicación (Admin)
    if (e.target.id === "adminConfirmDuplicateBtn") 
    {
        e.preventDefault();
        confirmAdminDuplicateCourseOffering();
        return;
    }

    // Cambio de año destino (Admin) - en el listener change
    // Añadir dentro de document.addEventListener("change", ...)
    if (e.target.id === "adminTargetAcademicYearSelect") 
    {
        const targetYearId = e.target.value;
        handleAdminDuplicateTargetYearChange(targetYearId);
        return;
    }
    // EDITAR CURSO OFFERING
    if (e.target.classList.contains("edit-offering-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const offeringId = e.target.dataset.id;
        const subjectId = e.target.dataset.subjectId;
        const yearId = e.target.dataset.yearId;
    
        if (offeringId && subjectId && yearId) 
        {
           openEditCourseOfferingModalController(offeringId, subjectId, yearId);
        }
        return;
    }

    // CONFIRMAR EDITAR COURSE OFFERING
    if (e.target.id === "confirmEditOfferingBtn") 
    {
        e.preventDefault();
        const offeringId = e.target.dataset.id;
        const subjectId = document.getElementById("modalSubjectId")?.value;
        const academicYearId = document.getElementById("modalAcademicYearId")?.value;
    
        if (!subjectId || !academicYearId) 
        {
            showNotificationController("Please select both subject and academic year", "error");
            return;
        }
    
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "Saving...";
        btn.disabled = true;
    
        const result = await editCourseOfferingController(offeringId, subjectId, academicYearId);
    
        btn.innerHTML = originalText;
        btn.disabled = false;
    
        if (result.success) 
        {
            closeAcademicModalController();
        }
        return;
    }
    
    // CAMBIAR PESTAÑA EN ACADEMIC STRUCTURE
    if (e.target.classList.contains("academic-tab")) 
    {
        const tab = e.target.dataset.tab;
        changeAcademicStructureTab(tab);
        return;
    }
    // ELIMINAR ASIGNATURA 
    if (e.target.classList.contains("delete-subject-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const subjectId = e.target.dataset.id;
        const subjectName = e.target.dataset.name || "";
    
        if (subjectId && subjectName) 
        {
        openDeleteSubjectConfirmModal(subjectId, subjectName);
        }
        return;
    }

    // CONFIRMAR ELIMINAR ASIGNATURA (desde el modal)
    if (e.target.classList.contains("confirm-delete-subject-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const subjectId = e.target.dataset.subjectId;
        const subjectName = e.target.dataset.subjectName;
    
        if (subjectId) 
        {
            deleteSubjectController(subjectId, subjectName);
            closeDeleteSubjectModalController();
        }
        return;
    }

    // CERRAR MODAL ELIMINAR ASIGNATURA (X o Cancel)
    if (e.target.classList.contains("close-delete-subject-modal") || 
    e.target.classList.contains("cancel-delete-subject-btn")) 
    {
        e.preventDefault();
        closeDeleteSubjectModalController();
        return;
    }

    // Cerrar modal al hacer clic fuera
    if (e.target.classList.contains("delete-subject-modal-overlay")) 
    {
        closeDeleteSubjectModalController();
        return;
    }
    // CREATE SUBJECT BUTTON (desde Academic Structure)
    if (e.target.id === "createSubjectBtn" || e.target.closest("#createSubjectBtn")) 
    {
        e.preventDefault();
        let source = "academic"; 
        if (document.querySelector(".courses-container")) {
            source = "courses";
        } else if (document.querySelector(".academic-structure-page")) {
            source = "academic";
        }
        
        openCreateSubjectModalController(source);
        return;
    }
    // CONFIRMAR CREAR ASIGNATURA 
    if (e.target.id === "confirmCreateSubjectBtn") 
    {
        e.preventDefault();
        const name = document.getElementById("modalSubjectName")?.value;
        const description = document.getElementById("modalSubjectDescription")?.value;

        if (!name || name.trim() === "") {
            showNotificationController("Subject name is required", "error");
            return;
        }

        const fromDashboard = window.__creatingFromDashboard === true;
        if (fromDashboard) {
            window.__creatingFromDashboard = false;
        }

        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "Creating...";
        btn.disabled = true;

        const result = await createSubjectController(name, description, fromDashboard);

        btn.innerHTML = originalText;
        btn.disabled = false;

        if (result.success) {
            closeSubjectModalController();
        }
        return;
    }
    // EDITAR ASIGNATURA 
    if (e.target.classList.contains("edit-subject-btn")) 
    {
        e.preventDefault();
        const subjectId = e.target.dataset.id;
        const subjectName = e.target.dataset.name || "";
        const subjectDescription = e.target.dataset.description || "";
        openEditSubjectModalController(subjectId, subjectName, subjectDescription);
        return;
    }

    // CONFIRMAR EDITAR ASIGNATURA
    if (e.target.id === "confirmEditSubjectBtn") 
    {
        e.preventDefault();
        const subjectId = e.target.dataset.id;
        const name = document.getElementById("modalSubjectName")?.value;
        const description = document.getElementById("modalSubjectDescription")?.value;
    
        if (!name || name.trim() === "") 
        {
            showNotificationController("Subject name is required", "error");
            return;
        }
    
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "Saving...";
        btn.disabled = true;
    
        const result = await editSubjectController(subjectId, name, description);
    
        btn.innerHTML = originalText;
        btn.disabled = false;
    
        if (result.success) 
        {
            closeSubjectModalController();
        }
        return;
    }
    // DOWNLOAD SUBJECTS TEMPLATE BUTTON
    if (e.target.id === "downloadSubjectsTemplateBtn" || e.target.closest("#downloadSubjectsTemplateBtn")) 
    {
        e.preventDefault();
        downloadSubjectsTemplateController();
        return;
    }
    // CREATE ACADEMIC YEAR BUTTON
    if (e.target.id === "createAcademicYearBtn" || e.target.closest("#createAcademicYearBtn")) 
    {
        e.preventDefault();
        openCreateAcademicYearModalController();
        return;
    }

    // CONFIRMAR CREAR AÑO ACADÉMICO
    if (e.target.id === "confirmCreateYearBtn") 
    {
        e.preventDefault();
        const startYear = document.getElementById("modalStartYear")?.value;
        const endYear = document.getElementById("modalEndYear")?.value;
    
        if (!startYear || !endYear) 
        {
            showNotificationController("Both years are required", "error");
            return;
        }
    
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "Creating...";
        btn.disabled = true;
    
        const result =  await createAcademicYearController(startYear, endYear);
    
        btn.innerHTML = originalText;
        btn.disabled = false;
    
        if (result.success) 
        {
            closeAcademicModalController();
            // loadAcademicStructure(); // Recargar la vista
        }
        return;
    }

    // EDITAR AÑO ACADÉMICO 
    if (e.target.classList.contains("edit-year-btn")) 
    {
        e.preventDefault();
        const yearId = e.target.dataset.id;
        const startYear = e.target.dataset.start;
        const endYear = e.target.dataset.end;
        openEditAcademicYearModalController(yearId, startYear, endYear);
        return;
    }

    // CONFIRMAR EDITAR AÑO ACADÉMICO
    if (e.target.id === "confirmEditYearBtn") 
    {
        e.preventDefault();
        const yearId = e.target.dataset.id;
        const startYear = document.getElementById("modalStartYear")?.value;
        const endYear = document.getElementById("modalEndYear")?.value;
    
        if (!startYear || !endYear) 
        {
            showNotificationController("Both years are required", "error");
            return;
        }
    
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "Saving...";
        btn.disabled = true;
    
        const result = await updateAcademicYearController(yearId, startYear, endYear);
    
        btn.innerHTML = originalText;
        btn.disabled = false;
    
        if (result.success) 
        {
            closeAcademicModalController();
            // loadAcademicStructure();
        }
        return;
    }

    // ELIMINAR AÑO ACADÉMICO 
    if (e.target.classList.contains("delete-year-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const yearId = e.target.dataset.id;
        const yearName = e.target.dataset.name || "";
        deleteAcademicYearController(yearId, yearName);
        return;
    }
    //CONFIRMAR ELIMINAR AÑO ACADÉMICO 
    if (e.target.classList.contains("confirm-delete-academic-year-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const yearId = e.target.dataset.yearId;
        const yearName = e.target.dataset.yearName;
    
        if (yearId) 
        {
            // Deshabilitar botón mientras se procesa
            const btn = e.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = "⏳ Deleting...";
            btn.disabled = true;
            const result =  confirmDeleteAcademicYear(yearId, yearName);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        return;
    }

    // CERRAR MODAL ELIMINAR AÑO ACADÉMICO
    if (e.target.classList.contains("close-delete-academic-year-modal") || 
    e.target.classList.contains("cancel-delete-academic-year-btn")) 
    {
        e.preventDefault();
        closeDeleteAcademicYearModalController();
        return;
    }

    // CREATE COURSE OFFERING BUTTON
    if (e.target.id === "createOfferingBtn" || e.target.closest("#createOfferingBtn")) 
    {
        e.preventDefault();
        openCreateCourseOfferingModalController();
        return;
    }

    // CONFIRMAR CREAR COURSE OFFERING
    if (e.target.id === "confirmCreateOfferingBtn") 
    {
        e.preventDefault();
        const subjectId = document.getElementById("modalSubjectId")?.value;
        const academicYearId = document.getElementById("modalAcademicYearId")?.value;
    
        if (!subjectId || !academicYearId) 
        {
            showNotificationController("Please select both subject and academic year", "error");
            return;
        }
    
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "Creating...";
        btn.disabled = true;
    
        const result = await createCourseOfferingController(subjectId, academicYearId);
    
        btn.innerHTML = originalText;
        btn.disabled = false;
        if (result.success) 
        {
            closeAcademicModalController();
        }
        return;
    }

    // ELIMINAR COURSE OFFERING 
    if (e.target.classList.contains("delete-offering-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const offeringId = e.target.dataset.id;
        const subjectName = e.target.dataset.subject || "";
        const academicYear = e.target.dataset.year || "";
    
        if (offeringId && subjectName) 
        {
            openDeleteCourseOfferingConfirmModal(offeringId, subjectName, academicYear);
        }
        return;
    }
    // CONFIRMAR ELIMINAR COURSE OFFERING (desde el modal)
    if (e.target.classList.contains("confirm-delete-course-offering-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const offeringId = e.target.dataset.offeringId;
        const subjectName = e.target.dataset.subjectName;
        const academicYear = e.target.dataset.academicYear;
        console.log(offeringId);
        if (offeringId) 
        {
            const btn = e.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = "⏳ Deleting...";
            btn.disabled = true;
            await confirmDeleteCourseOffering(offeringId, subjectName, academicYear);  
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        return;
    }
    // CERRAR MODAL ELIMINAR COURSE OFFERING (X o Cancel)
    if (e.target.classList.contains("close-delete-course-offering-modal") || 
    e.target.classList.contains("cancel-delete-course-offering-btn")) 
    {
        e.preventDefault();
        closeDeleteCourseOfferingModalController();
        return;
    }
    // DOWNLOAD COURSE OFFERINGS TEMPLATE
    if (e.target.id === "downloadOfferingsTemplateBtn" || e.target.closest("#downloadOfferingsTemplateBtn")) 
    {
        e.preventDefault();
        downloadCourseOfferingsTemplateController();
        return;
    }

    // CERRAR MODAL ACADÉMICO (X o Cancel)
    if (e.target.classList.contains("close-modal") || e.target.classList.contains("cancel-modal-btn")) 
    {
        e.preventDefault();
        closeAcademicModalController();
        return;
    }

    // REMOVE PROFESSOR BUTTON - Abrir modal en lugar de confirm directo
    if (e.target.classList.contains("remove-professor-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const assignmentId = e.target.dataset.assignmentId;
        const professorName = e.target.dataset.professorName;
        const offeringId = e.target.dataset.offeringId;
        const subjectName = e.target.closest(".course-title-page")?.textContent || "this course";
    
        if (assignmentId && professorName) 
        {
            openRemoveProfessorConfirmModal(assignmentId, professorName, subjectName, offeringId);
        }
        return;
    }

    // CONFIRMAR ELIMINAR PROFESOR (desde el modal)
    if (e.target.classList.contains("confirm-remove-professor-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const assignmentId = e.target.dataset.assignmentId;
        const professorName = e.target.dataset.professorName;
         const offeringId = e.target.dataset.offeringId;  
    
        if (assignmentId) 
        {
            confirmRemoveProfessor(assignmentId, professorName, offeringId);
        }
        return;
    }

    // CERRAR MODAL ELIMINAR PROFESOR (X o Cancel)
    if (e.target.classList.contains("close-remove-professor-modal") || 
    e.target.classList.contains("cancel-remove-professor-btn")) 
    {
        e.preventDefault();
        closeRemoveProfessorModalController();
        return;
    }

    // Cerrar modal al hacer clic fuera
    if (e.target.classList.contains("remove-professor-modal-overlay")) 
    {
        closeRemoveProfessorModalController();
        return;
    }
    // ABRIR MODAL ASIGNAR PROFESOR
    if (e.target.id === "openAssignProfessorModalBtn" || e.target.closest("#openAssignProfessorModalBtn")) 
    {
        e.preventDefault();
        const offeringId = e.target.dataset.offeringId || e.target.closest("#openAssignProfessorModalBtn")?.dataset.offeringId;
        if (offeringId) 
        {
            openAssignProfessorModal(offeringId);
        }
        return;
    }
    // ASIGNAR PROFESOR DESDE MODAL
    if (e.target.classList.contains("assign-professor-btn")) 
    {
        e.preventDefault();
        const professorEmail = e.target.dataset.professorEmail;
        const professorName = e.target.dataset.professorName;
        const offeringId = e.target.dataset.offeringId;
        if (professorEmail && offeringId) 
        {
            const btn = e.target;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = "⏳ Assigning...";
            assignProfessorFromModal(professorEmail, offeringId, professorName);
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
        return;
    }
    // PROFESSORS TAB BUTTON
    if (e.target.classList.contains("professors-tab-btn") || e.target.closest(".professors-tab-btn")) 
    {
        const offeringId = e.target.closest(".professors-tab-btn")?.dataset.offeringid;
        if (offeringId) 
        {
            loadCourseProfessors(offeringId);
        }
        return;
    }

    // ASSIGN PROFESSOR BUTTON
    if (e.target.id === "assignProfessorBtn" || e.target.closest("#assignProfessorBtn")) 
    {
        e.preventDefault();
        const email = document.getElementById("professorEmailInput")?.value;
        const roleSelect = document.getElementById("professorRoleSelect");
        const offeringId = e.target.dataset.offeringId || e.target.closest("#assignProfessorBtn")?.dataset.offeringId;
        const isTutorRole = roleSelect?.value === "true"; 
        if (email && email.trim() && offeringId) {
            const btn = e.target;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = "⏳ Assigning...";
            assignProfessorToCourseController(email, offeringId, isTutorRole);
            btn.disabled = false;
            btn.innerHTML = originalText;
            document.getElementById("professorEmailInput").value = "";
        } 
        else 
        {
            showNotificationController("Please enter a professor email", "error");
        }
        return;
    }

    // DOWNLOAD TEMPLATE BUTTON
    if (e.target.id === "downloadTemplateBtn" || e.target.closest("#downloadTemplateBtn")) 
    {
        e.preventDefault();
        downloadProfessorsTemplateController();
        return;
    }

    // UPLOAD EXCEL - El evento change se maneja aparte (ver abajo)
    // BULK JSON BUTTON
    if (e.target.id === "bulkJsonBtn" || e.target.closest("#bulkJsonBtn")) 
    {
        e.preventDefault();
        const offeringId = e.target.dataset.offeringId || e.target.closest("#bulkJsonBtn")?.dataset.offeringId;
        if (offeringId) 
        {
        openBulkJsonModal(offeringId);
        }
        return;
    }

    // REMOVE PROFESSOR BUTTON
    if (e.target.classList.contains("remove-professor-btn")) 
    {
        e.preventDefault();
        const assignmentId = e.target.dataset.assignmentId;
        const professorName = e.target.dataset.professorName;
        const offeringId = e.target.dataset.offeringId;
        if (assignmentId && confirm(`¿Eliminar a ${professorName} de este curso?`)) 
        {
        removeProfessorAssignmentController(assignmentId, offeringId, professorName);
        }
        return;
    }
    // BOTÓN DUPLICATE COURSE OFFERING
    if (e.target.id === "duplicateCourseOfferingBtn" || e.target.closest("#duplicateCourseOfferingBtn")) 
    {
        e.preventDefault();
        openDuplicateCourseOfferingModal();
        return;
    }

    // CERRAR MODAL DUPLICATE OFFERING (X)
    if (e.target.id === "closeDuplicateOfferingModalBtn" || e.target.closest("#closeDuplicateOfferingModalBtn")) 
    {
        e.preventDefault();
        closeDuplicateOfferingModalController();
        return;
    }

    // CLIC EN OVERLAY (cerrar)
    if (e.target.id === "duplicateOfferingModalOverlay" && e.target === e.currentTarget) 
    {
        closeDuplicateOfferingModalController();
        return;
    }

    // SELECCIÓN DE AÑO (tabs)
    if (e.target.classList.contains("duplicate-year-tab")) 
    {
        e.preventDefault();
        const year = e.target.dataset.year;
        handleDuplicateOfferingYearChange(year);
        return;
    }

    // SELECCIÓN DE OFERTA (botón Select)
    if (e.target.classList.contains("select-offering-btn")) 
    {
        e.preventDefault();
        const offeringId = parseInt(e.target.dataset.offeringId);
        const offeringName = e.target.dataset.offeringName;
        handleDuplicateOfferingSelect(offeringId, offeringName);
        return;
    }

    // CLIC EN TARJETA DE OFERTA (alternativa)
    if (e.target.closest(".duplicate-offering-card") && !e.target.classList.contains("select-offering-btn")) 
    {
        const card = e.target.closest(".duplicate-offering-card");
        const offeringId = parseInt(card.dataset.offeringId);
        const offeringName = card.dataset.offeringName;
        handleDuplicateOfferingSelect(offeringId, offeringName);
        return;
    }

    // BOTÓN NEXT STEP 1
    if (e.target.id === "step1NextBtn") 
    {
        e.preventDefault();
        duplicateOfferingNextStep();
        return;
    }

    // BOTÓN NEXT STEP 2
    if (e.target.id === "step2NextBtn") 
    {
        e.preventDefault();
        duplicateOfferingNextStep();
        return;
    }

    // BOTÓN BACK STEP 2
    if (e.target.id === "step2BackBtn") 
    {
        e.preventDefault();
        duplicateOfferingPrevStep();
        return;
    }

    // BOTÓN BACK STEP 3
    if (e.target.id === "step3BackBtn") 
    {
        e.preventDefault();
        duplicateOfferingPrevStep();
        return;
    }

    // CONFIRMAR DUPLICACIÓN
    if (e.target.id === "confirmDuplicateOfferingBtn") 
    {
        e.preventDefault();
        confirmDuplicateCourseOffering();
        return;
    }
    // BOTÓN EXPORT CSV
    if (e.target.id === "exportStudentsCSVBtn" || e.target.closest("#exportStudentsCSVBtn")) 
    {
        e.preventDefault();
        const offeringId = e.target.dataset.offeringId || e.target.closest("#exportStudentsCSVBtn")?.dataset.offeringId;
        const subjectName = e.target.closest(".course-students-container")?.querySelector(".course-title-page")?.textContent || "curso";
        
        if (offeringId) 
        {
            exportCourseStudentsCSVController(offeringId, subjectName);
        }
        return;
    }
    // UNENROLL STUDENT BUTTON (botón 🚫 en la tabla de estudiantes)
    if (e.target.classList.contains("unenroll-student-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const enrollmentId = e.target.dataset.enrollmentId;
        const studentName = e.target.dataset.studentName;
        const subjectName = e.target.closest(".course-students-container")?.querySelector(".course-title-page")?.textContent || "this course"; 
        if (enrollmentId && studentName) 
        {
            openUnenrollConfirmModal(enrollmentId, studentName, subjectName);
        }
        return;
    }

    // CONFIRMAR UNENROLL (desde el modal)
    if (e.target.classList.contains("confirm-unenroll-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const enrollmentId = e.target.dataset.enrollmentId;
        const studentName = e.target.dataset.studentName;
    
        if (enrollmentId && studentName) 
        {
            await confirmUnenrollStudent(enrollmentId, studentName);
        }
        return;
    }
    // CERRAR MODAL UNENROLL (X o Cancel)
    if (e.target.classList.contains("close-unenroll-modal") || e.target.classList.contains("cancel-unenroll-btn")) 
    {
        e.preventDefault();
        closeUnenrollModalController();  
        return;
    }
    
    // BOTÓN EXPORT CSV
    if (e.target.id === "exportStudentsCSVBtn" || e.target.closest("#exportStudentsCSVBtn")) 
    {
        e.preventDefault();
        const offeringId = e.target.dataset.offeringId || e.target.closest("#exportStudentsCSVBtn")?.dataset.offeringId;
        if (offeringId) 
        {
            exportStudentsCSVController(offeringId);
        }
        return;
    }

    // VIEW STUDENT BUTTON
    if (e.target.classList.contains("view-student-btn")) 
    {
        e.preventDefault();
        const studentId = e.target.dataset.studentId;
        const studentName = e.target.dataset.studentName;
        if (studentId) 
        {
            viewStudentProfileController(studentId, studentName);
        }
        return;
    }
    // ENROLL STUDENT BUTTON
    if (e.target.id === "enrollStudentBtn" || e.target.closest("#enrollStudentBtn")) 
    {
        e.preventDefault();
        const offeringId = e.target.dataset.offeringId;
        const subjectId = e.target.dataset.subjectId;
    
        if (offeringId && subjectId) 
        {
            openEnrollStudentModal(offeringId, subjectId);
        } 
        else 
        {
            showNotificationController("Error: Missing course information", "error");
        }
        return;
    }
    // STUDENTS TAB BUTTON (nuevo)
    if (e.target.classList.contains("students-tab-btn") || e.target.closest(".students-tab-btn")) 
    {
        const offeringId = e.target.closest(".students-tab-btn")?.dataset.offeringid;
        if (offeringId) 
        {
            loadCourseStudents(offeringId);  
        }
        return;
    }
    // BOTÓN DE CONFIRMAR MATRÍCULA 
    if (e.target.classList.contains("confirm-enroll-student-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const studentId = e.target.dataset.studentId;
        const studentName = e.target.dataset.studentName;
        const offeringId = e.target.dataset.offeringId;
        confirmEnrollStudent(studentId, studentName, offeringId);
        return;
    }
    // BOTÓN PARA ABRIR MODAL DE MATRICULAR
    if (e.target.id === "enrollStudentBtn" || e.target.closest("#enrollStudentBtn")) 
    {
        e.preventDefault();
        const offeringId = e.target.dataset.offeringId;
        const subjectId = e.target.dataset.subjectId;

        if (offeringId && subjectId) {
            openEnrollStudentModal(offeringId, subjectId);
        } else {
            showNotificationController("Error: Missing course information", "error");
        }
        return;
    }
    // Marcar notificación individual como leída (botón ✓)
    if (e.target.classList.contains("notification-mark-read")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const messageId = e.target.dataset.messageId;
        if (messageId) {
            await markSingleMessageAsReadController(messageId);
        }
        return;
    }   
    // Clic en la notificación (NO HACE NADA - solo evita que se propague)
    const notifItem = e.target.closest(".notification-item");
    if (notifItem && !e.target.classList.contains("notification-mark-read")) 
    {
        // No hacer nada al hacer clic en la notificación
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    // Toggle notifications dropdown
    if (e.target.closest("#notificationsIcon") || e.target.closest(".noti")) 
    {
        e.preventDefault();
        e.stopPropagation();
        toggleNotificationsDropdown();
        return;
    }
    
    // Marcar todas como leídas
    if (e.target.closest("#markAllReadBtn")) 
    {
        e.preventDefault();
        await markAllNotificationsReadController();
        await loadAndRenderNotifications();
        await updateNotificationsBadge();
        closeNotificationsDropdown();
        return;
    }

    
    // Cerrar dropdown al hacer clic fuera
    if (!e.target.closest("#notificationsDropdown") && !e.target.closest(".noti")) 
    {
        closeNotificationsDropdown();
    }
    // DUPLICATE EXERCISE BUTTON
    if (e.target.classList.contains("duplicate-exercise-btn") || 
    e.target.classList.contains("duplicate-exercise-btn-icon") ||
    e.target.closest(".duplicate-exercise-btn-icon")) 
    {
        const exerciseId = e.target.closest(".duplicate-exercise-btn-icon")?.dataset.id || e.target.dataset.id;
        const exerciseTitle = e.target.closest(".duplicate-exercise-btn-icon")?.dataset.title || e.target.dataset.title;
        loadDuplicateExerciseModal(exerciseId, exerciseTitle);
        return;
    }
    //CSV
    if (e.target.id === "exportSubmissionsBtn" || e.target.closest("#exportSubmissionsBtn")) 
    {
        e.preventDefault();
        exportSubmissionsController();
        return;
    }
    // CLEAR FILTERS BUTTON - SOLO LIMPIA LOS INPUTS
    if (e.target.id === "clearFiltersBtn" || e.target.closest("#clearFiltersBtn")) 
    {
        e.preventDefault();
        clearFiltersController(); 
        return;
    }
    // CLOSE DUPLICATE MODAL (X)
    if (e.target.classList.contains("close-duplicate-modal")) {
        closeDuplicateModalController();
        return;
    }
    
    // CANCEL DUPLICATE
    if (e.target.classList.contains("cancel-duplicate-btn")) {
        closeDuplicateModalController();
        return;
    }
    
    // CONFIRM DUPLICATE
    if (e.target.classList.contains("confirm-duplicate-btn")) {
        const exerciseId = e.target.dataset.exerciseId;
        const targetCourseSelect = document.getElementById("targetCourse");
        const targetOfferingId = targetCourseSelect?.value;
        
        if (!targetOfferingId) {
            showNotificationController("Please select a target course", "error");
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        const confirmBtn = e.target;
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = "⏳ Duplicating...";
        confirmBtn.disabled = true;
        
        await confirmDuplicateExercise(exerciseId, targetOfferingId);
        
        closeDuplicateModalController();
        
        // No recargar aquí porque ya lo hace confirmDuplicateExercise
        return;
    }
    // CREATE EXERCISE FROM DASHBOARD BUTTON (profesor)
    if (e.target.id === "createExerciseFromDashboardBtn" || e.target.closest("#createExerciseFromDashboardBtn")) {
         loadCreateExercise(null, "dashboard");
        return;
    }
    
    // CREATE EXERCISE FROM COURSE BUTTON (profesor)
    if (e.target.id === "createExerciseFromCourseBtn" || e.target.closest("#createExerciseFromCourseBtn")) {
        const subjectId = e.target.dataset.subjectid;
        loadCreateExercise(subjectId, "course-exercises");
        return;
    }
    
    // VIEW SUBMISSION FROM DASHBOARD (profesor)
    if (e.target.classList.contains("view-submission-btn")) {
        const submissionId = e.target.dataset.submissionId;
        const from = e.target.dataset.from || "submissions";
        if (submissionId) {
            loadSubmissionReportController(submissionId, from);
        }
        return;
    }
    // CREATE EXERCISE BUTTON (en la página de exercises)
    if (e.target.classList.contains("create-exercise-btn")) 
    {
        loadCreateExercise(null,"exercises");
        return;
    }
    // ADD TEST CASE BUTTON (en creación)
    if (e.target.id === "addTestCaseBtn" || e.target.closest("#addTestCaseBtn")) 
    {
        e.preventDefault();
        addTestCaseToCreateForm();
        return;
    }
    // DELETE TEST CASE BUTTON (en creación)
    if (e.target.classList.contains("delete-test-btn")) 
    {
        e.preventDefault();
        const testItem = e.target.closest(".test-case-item");
        if (testItem && confirm("Delete this test case?")) 
        {
            deleteTestCaseFromCreateForm(testItem);
        }
        return;
    }

    // TOGGLE LANGUAGE CHIP (en creación)
    if (e.target.classList.contains("language-chip") || e.target.closest(".language-chip")) 
    {
        e.preventDefault();
        const chip = e.target.closest(".language-chip");
        toggleCreateFormLanguage(chip);
        return;
    }

    // CANCEL CREATE BUTTON
    if (e.target.id === "cancelCreateBtn" || e.target.closest("#cancelCreateBtn")) 
    {
        e.preventDefault();
        loadExercises(); // Volver a la lista de ejercicios
        setActiveMenu(2);
        return;
    }
    // ADD ARGUMENT BUTTON (en creación)
    if (e.target.id === "addArgumentBtn" || e.target.closest("#addArgumentBtn")) 
    {
        e.preventDefault();
        addArgumentToCreateForm();
        return;
    }
    // DELETE ARGUMENT BUTTON (en creación)
    if (e.target.classList.contains("delete-argument-btn")) 
    {
        e.preventDefault();
        const argumentItem = e.target.closest(".argument-item");
        if (argumentItem && confirm("Delete this argument?")) 
        {
            deleteArgumentFromCreateForm(argumentItem);
        }
        return;
    }
    // CREATE EXERCISE SUBMIT
    if (e.target.id === "createExerciseBtn" || e.target.closest("#createExerciseBtn")) {
        e.preventDefault();
        const title = document.getElementById("exerciseTitle")?.value;
        const description = document.getElementById("exerciseDescription")?.value;
        const courseSelect = document.getElementById("exerciseCourse");
        const courseOfferingId = courseSelect?.value;
        const deadline = document.getElementById("exerciseDeadline")?.value;
        const evaluationMode = document.getElementById("evaluationMode")?.value;
        const returnType = document.getElementById("returnType")?.value || "int";
        const visibleCheckbox = document.getElementById("exerciseVisible");
        const isVisible = visibleCheckbox ? visibleCheckbox.checked : true;
        const solution = document.getElementById("solutionCode")?.value;
        const selectedLanguages = getCreateFormSelectedLanguages();
        const testCases = getCreateFormTestCases();
        const argumentsList = getCreateFormArguments(); 
        const rubricData = getRubricDataFromFormController();
        if (!title || title.trim() === "") 
        {
            showNotificationController("Title is required", "error");
            return;
        }
        if (!description || description.trim() === "") 
        {
            showNotificationController("Description is required", "error");
            return;
        }
        if (!courseOfferingId) 
        {
            showNotificationController("Please select a course", "error");
            return;
        }
        if (!deadline) 
        {
            showNotificationController("Deadline is required", "error");
            return;
        }
        if (selectedLanguages.length === 0) 
        {
            showNotificationController("Please select at least one programming language", "error");
            return;
        }
        const createBtn = document.getElementById("createExerciseBtn");
        const originalText = createBtn.innerHTML;
        createBtn.innerHTML = "⏳ Creating...";
        createBtn.disabled = true;
    
        const formData = 
        {
            title: title,
            description: description,
            courseOfferingId: courseOfferingId,
            deadline: deadline,
            evaluation_mode: evaluationMode,
            return_type: returnType,  
            visibility: isVisible,
            solution: solution || "",
            languageIds: selectedLanguages,
            testCases: testCases,
            arguments: argumentsList,
            rubricData: rubricData
        };
        console.log("Test cases from form:", testCases);
        const result = await handleCreateExercise(formData);
        if (result.success) 
        {
            showNotificationController("Exercise created successfully!", "success");
            loadEditExercise(result.exerciseId);
        } 
        else 
        {
            showNotificationController(result.error || "Error creating exercise", "error");
        }
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
        return;
    }
    // COURSE DETAILS
    if (e.target.classList.contains("btn-details")) 
    {
        const offeringId = e.target.dataset.id;  
        const subjectId = e.target.dataset.subjectId;
        loadCourseExercises(offeringId, "courses", subjectId);
        return;
    }   
    // START CODING (for students and professors in test mode)
    if (e.target.classList.contains("start-coding-btn") || e.target.closest(".start-coding-btn")) {
        const btn = e.target.closest(".start-coding-btn");
        const exerciseId = btn.dataset.id;
        const courseId = btn.dataset.courseid;
        const fromExercises = btn.dataset.fromExercises === "true";
        const rol = localStorage.getItem("rol");
        let source = "course-exercises";
        if (rol === "teacher" || rol === "admin") {
            source = fromExercises ? "teacher-exercises" : "teacher-course";
        }
        loadCodingExercise(exerciseId, source, courseId);
        return;
    }
    // START CODING
    if (e.target.classList.contains("primary-btn")) {
        const exerciseId = e.target.dataset.id;
        loadCodingExercise(exerciseId, "exercises");
        return;
    }

    // EDIT EXERCISE BUTTON
    if (e.target.classList.contains("edit-exercise-btn")) 
    {
        const exerciseId = e.target.dataset.id;
        const subjectId = e.target.closest(".course-exercises-container")?.querySelector(".back-btn")?.dataset.subjectid;
        // Detectar el origen
        let source = "exercises"; // por defecto
        if (document.querySelector(".course-exercises-header")) {
            source = "course-exercises";
        } else if (document.querySelector(".dashboard")) {
            source = "dashboard";
        }
        
        loadEditExercise(exerciseId, subjectId, source);
        setTimeout(() => {
        const evaluationModeSelect = document.getElementById("evaluationMode");
        if (evaluationModeSelect) {
            // Eliminar listener anterior si existe
            const oldListener = evaluationModeSelect._listener;
            if (oldListener) {
                evaluationModeSelect.removeEventListener("change", oldListener);
            }
            
            const handleModeChange = () => {
                const argumentsSection = document.getElementById("editArgumentsSection");
                const isFunctionCalls = evaluationModeSelect.value === "function_calls";
                if (argumentsSection) {
                    argumentsSection.style.display = isFunctionCalls ? "block" : "none";
                }
            };
            
            evaluationModeSelect.addEventListener("change", handleModeChange);
            evaluationModeSelect._listener = handleModeChange; // Guardar referencia
            
            // Ejecutar una vez al cargar para mostrar/ocultar según el valor actual
            handleModeChange();
        }
        }, 200);
    
        return;
    }
    // SAVE EXERCISE BUTTON (con argumentos y rúbrica)
    if (e.target.id === "saveExerciseBtn" || e.target.closest("#saveExerciseBtn")) {
        e.preventDefault();
        const exerciseId = document.querySelector(".edit-exercise-page")?.dataset.exerciseId;
        if (!exerciseId) return;

        const visibleCheckbox = document.getElementById("exerciseVisible");
        const isVisible = visibleCheckbox ? visibleCheckbox.checked : true;
        const evaluationMode = document.getElementById("evaluationMode")?.value || "legacy_stdin";
        const returnType = document.getElementById("returnType")?.value || "int";

        let deadlineValue = document.getElementById("exerciseDeadline")?.value || "";
        let formattedDeadline = deadlineValue;

        const formData = {
            title: document.getElementById("exerciseTitle")?.value || "",
            description: document.getElementById("exerciseDescription")?.value || "",
            deadline: formattedDeadline,
            evaluation_mode: evaluationMode,
            return_type: returnType,
            solution: document.getElementById("solutionCode")?.value || "",
            visibility: isVisible
        };

        // Obtener argumentos si es modo function_calls
        let argumentsData = [];
        if (evaluationMode === "function_calls") {
            argumentsData = getEditFormArguments();  // Función de view.js
        }

        const rubricData = getRubricDataFromFormController(); // Función de controller.js

        const saveBtn = e.target.closest("#saveExerciseBtn");
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = "⏳ Saving...";
        saveBtn.disabled = true;

        const result = await handleSaveExerciseWithArguments(exerciseId, formData, argumentsData, rubricData);

        if (result.success) {
            showNotificationController("Exercise saved successfully!", "success");
            await loadEditExercise(exerciseId);
        } else {
            showNotificationController(result.error || "Error saving exercise", "error");
        }

        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        return;
    }
    // TOGGLE RUBRIC SECTION
    if (e.target.id === "toggleRubricBtn" || e.target.closest("#toggleRubricBtn")) 
    {
        const rubricContainer = document.getElementById("rubricContainer");
        const toggleIcon = e.target.closest(".toggle-rubric-btn")?.querySelector(".toggle-icon");
        if (rubricContainer) 
        {
            const isHidden = rubricContainer.style.display === "none";
            rubricContainer.style.display = isHidden ? "block" : "none";
            if (toggleIcon) toggleIcon.textContent = isHidden ? "▲" : "▼";
        }
        return;
    }   
    if (e.target.id === "exerciseDeadline") 
    {
    console.log("📅 FECHA SELECCIONADA MANUALMENTE:", e.target.value);
    }
// ADD CRITERION BUTTON - CORREGIDO
if (e.target.id === "addCriterionBtn" || e.target.closest("#addCriterionBtn")) 
{
    e.preventDefault();
    addCriterionToRubricUIController();  // Llama al controller, NO directamente a view
    return;
}

// REMOVE CRITERION BUTTON - CORREGIDO
if (e.target.classList.contains("remove-criterion-btn")) 
{
    e.preventDefault();
    const index = parseInt(e.target.dataset.index);
    if (!isNaN(index)) 
    {
        removeCriterionFromRubricUIController(index);  // Llama al controller
    }
    return;
}

// CLEAR RUBRIC BUTTON - CORREGIDO
if (e.target.id === "clearRubricBtn" || e.target.closest("#clearRubricBtn")) 
{
    e.preventDefault();
    if (confirm("Are you sure you want to clear all criteria?")) 
    {
        clearAllRubricCriteriaUIController();  // Llama al controller
    }
    return;
}

// SAVE RUBRIC BUTTON - CORREGIDO
if (e.target.id === "saveRubricBtn" || e.target.closest("#saveRubricBtn")) 
{
    e.preventDefault();
    const exerciseId = document.querySelector(".edit-exercise-page")?.dataset.exerciseId;
    if (exerciseId) 
    {
        const rubricData = getRubricDataFromFormController();  // Llama al controller
        
        if (rubricData && rubricData.criteria.length > 0) 
        {
            const saveBtn = e.target.closest("#saveRubricBtn");
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = "⏳ Saving...";
            saveBtn.disabled = true;
        
            const result = await saveRubric(exerciseId, rubricData);  // Esta función ya está en controller.js
        
            if (result.success) 
            {
                showNotificationController("Rubric saved successfully!", "success");
            } 
            else 
            {
                showNotificationController(result.error, "error");
            }
        
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        } 
        else 
        {
            showNotificationController("Please add at least one criterion", "warning");
        }
    }
    return;
}

    // UPDATE CRITERIA COUNT 
    if (e.target.classList.contains("criterion-name-input") ||
    e.target.classList.contains("criterion-description-input")) 
    {
        updateRubricCriteriaCountController();  // Solo actualizar contador
        return;
    }
    // ADD ARGUMENT BUTTON (en edición)
    if (e.target.id === "addEditArgumentBtn" || e.target.closest("#addEditArgumentBtn")) 
    {
        e.preventDefault();
        addEditArgumentToFormController();
        return;
    }
    // DELETE ARGUMENT BUTTON (en edición)
    if (e.target.classList.contains("delete-edit-argument-btn")) 
    {
        e.preventDefault();
        const argumentItem = e.target.closest(".argument-item");
        if (argumentItem && confirm("Delete this argument?")) 
        {
            deleteEditArgumentController(argumentItem);
        }
        return;
    }
    // Mover argumento hacia arriba (en edición)
    if (e.target.classList.contains("move-argument-up-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const argumentItem = e.target.closest(".argument-item");
        if (argumentItem) 
        {
            moveArgumentUpController(argumentItem);
        }
        return;
    }
    // Mover argumento hacia abajo (en edición)
    if (e.target.classList.contains("move-argument-down-btn")) 
    {
        e.preventDefault();
        e.stopPropagation();
        const argumentItem = e.target.closest(".argument-item");
        if (argumentItem) 
        {
            moveArgumentDownController(argumentItem);
        }
        return;
    }
    // CANCEL EDIT PROFILE BUTTON (con nuevo id)
    if (e.target.closest("#cancelProfileEditBtn")) {
        document.getElementById("profileEditView")?.classList.add("hidden");
        document.getElementById("profileInfoView")?.classList.remove("hidden");
        return;
    }
    // CANCEL EDIT BUTTON (para edición de ejercicio)
    if (e.target.id === "cancelEditBtn" || e.target.closest("#cancelEditBtn")) {
        // Verificar que estamos en la página de edición de ejercicio
        if (document.querySelector(".edit-exercise-page")) {
            handleCancelEdit();
            return;
        }
        // Si no, no hacer nada (o redirigir a ejercicios)
        showNotificationController("No se puede cancelar desde aquí", "warning");
        return;
    }
    // ADD TEST CASE BUTTON
    if (e.target.id === "addTestCaseBtn" || e.target.closest("#addTestCaseBtn")) 
    {
    const exerciseId = document.querySelector(".edit-exercise-page")?.dataset.exerciseId;
    if (exerciseId) {
        const result = await handleAddTestCase(exerciseId);
        if (result.success) {
            showNotificationController("Test case added successfully", "success");
            loadEditExercise(exerciseId);
        } else {
            showNotificationController(result.error, "error");
        }
    }
    return;
    } 
    // DELETE TEST CASE BUTTON
    if (e.target.classList.contains("delete-test-btn")) 
    {
    const testId = e.target.dataset.testId;
    const exerciseId = document.querySelector(".edit-exercise-page")?.dataset.exerciseId;
    if (testId && exerciseId && confirm("Delete this test case?")) {
        const result = await handleDeleteTestCase(testId, exerciseId);
        if (result.success) {
            showNotificationController("Test case deleted", "success");
        } else {
            showNotificationController(result.error, "error");
        }
    }
    return;
    }

    // TOGGLE LANGUAGE CHIP
    if (e.target.classList.contains("language-chip") || e.target.closest(".language-chip")) 
    {
    const chip = e.target.closest(".language-chip");
    const exerciseId = document.querySelector(".edit-exercise-page")?.dataset.exerciseId;
    const languageId = parseInt(chip.dataset.langId);
    const isActive = chip.classList.contains("active");
    
    if (exerciseId && languageId) {
        chip.style.opacity = "0.6";
        chip.style.pointerEvents = "none";
        
        const result = await handleToggleLanguage(exerciseId, languageId, isActive);
        
        chip.style.opacity = "1";
        chip.style.pointerEvents = "auto";
        
        if (result.success) {
            loadEditExercise(exerciseId);
            showNotificationController(isActive ? "Language removed" : "Language added", "success");
        } else {
            showNotificationController(result.error, "error");
        }
    }
    return;
    }
    // VIEW EXERCISE SUBMISSIONS
    const submissionBtn = e.target.closest(".submission-btn") || e.target.closest(".submissions-btn");
    if (submissionBtn) {
        const exerciseId = submissionBtn.dataset.id;
        const from = submissionBtn.dataset.from || "exercises";
        const subjectId = submissionBtn.dataset.subjectid;
        loadExerciseSubmissions(exerciseId, from, subjectId);
        return;
    }
    
    // PINTAR EL FILTER
    if (e.target.closest(".filter-btn")) {
        loadSubmissionFilters();
    }
    
    // APLICAR LOS FILTROS
    if (e.target.id === "applySubmissionFilters") {
        applySubmissionFiltersController();
    }
    
    // BACK BUTTON
    const backBtn = e.target.closest(".back-btn");
    if (backBtn) {
        const backType = backBtn.dataset.back;
        const courseId = backBtn.dataset.courseid;
        const subjectId = backBtn.dataset.subjectid;
        console.log(backType);
        switch (backType) 
        {
            case "courses":
                loadCourses();
                break;
            case "course-exercises":
                const idToUse = subjectId || courseId;
                console.log(idToUse);
                if (idToUse) {
                    loadCourseExercises(idToUse, "courses", false);
                } else {
                    loadCourses();
                }
                break;
            case "dashboard":
                // En lugar de loadDashboard(), usamos el rol para cargar la vista correcta
                const currentRol = localStorage.getItem("rol");
                if (currentRol === "student") {
                    loadMainStudent();
                } else if (currentRol === "teacher") {
                    loadMainTeacher();
                } else if (currentRol === "admin") {
                    loadMainAdmin();
                } else {
                    loadDashboard(); // fallback
                }
                setActiveMenu(0);
                break;
            case "submissions":
                loadSubmissions();
                setActiveMenu(3);
                break;
            case "exercises":
                loadExercises();
                setActiveMenu(2);
                break;
            case "teacher-test":
                const courseIdFromBack = backBtn.dataset.courseid;
                if (courseIdFromBack && courseIdFromBack !== "undefined") {
                    loadCourseExercises(courseIdFromBack, "courses", false);
                } else {
                    loadExercises();
                    setActiveMenu(2);
                }
                break;
            case "teacher-exercises":
                loadExercises();
                setActiveMenu(2);
                break;
            case "teacher-course":
                if (courseId) {
                    loadCourseExercises(courseId, "courses", false);
                } else {
                    loadExercises();
                }
                break;
            case "exercise-submissions":
                // Volver a la lista de entregas del ejercicio
                const exerciseIdFromBack = backBtn.dataset.exerciseId;
                const subjectIdFromBack = backBtn.dataset.subjectid;
                if (exerciseIdFromBack) {
                    loadExerciseSubmissions(exerciseIdFromBack, "exercise-submissions", subjectIdFromBack);
                } else {
                    // fallback: ir a ejercicios
                    loadExercises();
                    setActiveMenu(2);
                }
                break;
            case "dashboard":
                loadDashboard();
                setActiveMenu(0);
                break;
            
        }
        return;
    }
    
    // SEND CHAT MESSAGE
    const sendBtn = e.target.closest(".send-chat-btn");
    if (sendBtn) {
        const receiverId = sendBtn.dataset.userid;
        const userName = sendBtn.dataset.username;
        const messageInput = document.getElementById("chatMessageInput");
        const message = messageInput?.value;

        if (message && message.trim()) {
            const success = sendChatMessageController(receiverId, message);
            if (success) {
                messageInput.value = "";
                loadChatController(receiverId, userName);
            }
        }
        return;
    }
    
    // DOWNLOAD CHAT ATTACHMENT
    const downloadAttBtn = e.target.closest(".download-attachment-btn");
    if (downloadAttBtn) 
    {
        const attachmentId = downloadAttBtn.dataset.attachmentid;
        const filename = downloadAttBtn.dataset.filename;
        downloadChatAttachmentController(attachmentId, filename);
        return;
    }
    
    // ELIMINAR ARCHIVO ADJUNTO (botón X)
    const deleteAttBtn = e.target.closest(".attachment-delete-btn");
    if (deleteAttBtn) {
        const attachmentId = deleteAttBtn.dataset.attachmentId;
        if (attachmentId && confirm("¿Eliminar este archivo?")) {
            deleteChatAttachmentController(attachmentId);
        }
        return;
    }
    
    // MARCAR CONVERSACIÓN COMO LEÍDA
    const clearChatBtn = e.target.closest(".clear-chat-btn");
    if (clearChatBtn) {
        const userId = clearChatBtn.closest(".chat-wrapper")?.querySelector(".send-chat-btn")?.dataset.userid;
        if (userId) {
            markConversationReadController(userId);
        }
        return;
    }
    
    // ELIMINAR MENSAJE (desde menú contextual)
    const deleteMsgBtn = e.target.closest(".message-delete-btn");
    if (deleteMsgBtn) 
    {
        e.preventDefault();
        const messageId = deleteMsgBtn.dataset.messageId;
        if (messageId && confirm("¿Eliminar este mensaje?")) 
        {
            deleteChatMessageController(messageId);
        }
        return;
    }
    
    // MENÚ CONTEXTUAL PARA MENSAJES PROPIOS (botón ⋮)
    const actionsBtn = e.target.closest(".message-actions-btn");
    if (actionsBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        // Eliminar menú existente
        const existingMenu = document.querySelector(".message-context-menu");
        if (existingMenu) existingMenu.remove();
        
        const messageId = actionsBtn.dataset.messageId;
        const rect = actionsBtn.getBoundingClientRect();
        
        const menu = document.createElement("div");
        menu.className = "message-context-menu";
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;
        menu.innerHTML = `
            <button class="delete-message-option" data-message-id="${messageId}">
                🗑️ Eliminar mensaje
            </button>
        `;
        
        document.body.appendChild(menu);
        
        // Cerrar menú al hacer clic fuera
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener("click", closeMenu);
            }
        };
        setTimeout(() => document.addEventListener("click", closeMenu), 0);
        
        return;
    }
    
    // RUN TEST
    const runBtn = e.target.closest(".run-btn");
    if (runBtn) {
        const finalExerciseId = runBtn.dataset.id;
        const languageId = runBtn.dataset.languageId;
        console.log("RUN LANGUAGE ID:", languageId);
        runCodingTestsController(finalExerciseId, languageId);
        return;
    }

    // SUBMIT
    const submitBtn = e.target.closest(".submit-btn");
    if (submitBtn) {
        const exerciseId = submitBtn.dataset.id;
        const languageId = submitBtn.dataset.languageId;
        console.log("SUBMIT:", exerciseId, languageId);
        submitCodingExerciseController(exerciseId, languageId);
        return;
    }
    
    // VIEW REPORT
    const viewBtn = e.target.closest(".view-btn");
    if (viewBtn) {
         // Ignorar botones que no son de ver reporte
        if (viewBtn.classList.contains("edit-exercise-btn") || 
        viewBtn.classList.contains("duplicate-exercise-btn") ||
        viewBtn.classList.contains("submissions-btn") ||
        viewBtn.classList.contains("submission-btn") ||
        viewBtn.classList.contains("start-coding-btn")) {
        return; 
        }
        const submissionId = viewBtn.dataset.submissionId;
        const from = viewBtn.dataset.from || "submissions";
        if (submissionId) 
        {
            loadSubmissionReportController(submissionId, from);
        }
        return;
    }
    
    // DOWNLOAD PDF
    const downloadPdfBtn = e.target.closest(".download-pdf-btn");
    if (downloadPdfBtn) {
        const submissionId = downloadPdfBtn.dataset.submissionId;
        downloadEvaluationPdfController(submissionId);
        return;
    }
    
    // CLICK COURSE (DASHBOARD)
    const courseItem = e.target.closest(".course-item");
    if (courseItem) {
        const courseId = courseItem.dataset.id;
        loadCourseExercises(courseId, "dashboard");
        setActiveMenu(1);
        return;
    }
    // COURSE EXERCISES TAB
    const exercisesTabBtn = e.target.closest(".exercises-tab-btn");
    if (exercisesTabBtn) 
    {
        const offeringId = exercisesTabBtn.dataset.offeringid;
        console.log("Exercises tab clicked - offeringId:", offeringId);
        if (offeringId) 
        {
            loadCourseExercises(offeringId, "courses");
        } 
        else 
        {
            console.error("No offeringId found on exercises button");
        }
        return;
    }
    // COURSE CHAT
    const messagesBtn = e.target.closest(".messages-tab-btn");
    if (messagesBtn) 
    {
    const offeringId = messagesBtn.dataset.offeringid;
    console.log(offeringId);
        if (offeringId) 
        {
            loadCourseMessagesController(offeringId);
        }
    return;
    }
    // OPEN CHAT
    const openChatBtn = e.target.closest(".open-chat-btn");
    if (openChatBtn) {
        const userId = openChatBtn.dataset.userid;
        const userName = openChatBtn.dataset.username;
        loadChatController(userId, userName);
        return;
    }
    // Copiar código al portapapeles (dentro del document.addEventListener("click", ...))
    if (e.target.classList.contains("copy-code-btn") || e.target.closest(".copy-code-btn")) {
        const btn = e.target.closest(".copy-code-btn");
        const code = btn.dataset.code;
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = "✅ Copied!";
                setTimeout(() => { btn.innerHTML = originalText; }, 1500);
            }).catch(err => {
                console.error("Error copying: ", err);
                btn.innerHTML = "❌ Failed";
                setTimeout(() => { btn.innerHTML = originalText; }, 1500);
            });
        }
        return;
    }
    // LOGOUT BUTTON
    const logoutBtn = e.target.closest(".logout-btn");
    if (logoutBtn) {
        openLogoutModal();
        return;
    }
    // MY PROFILE - Desde el menú de usuario
    const profilebtn = e.target.closest(".my-profile-btn");
    if (profilebtn) 
    {   
        loadMyProfile();
        return;
    }
    // EDIT PROFILE BUTTON
    if (e.target.closest("#editProfileBtn")) 
    {
        document.getElementById("profileInfoView")?.classList.add("hidden");
        document.getElementById("profileEditView")?.classList.remove("hidden");
        return;
    }

    // USER CLICK
    const userDiv = e.target.closest(".user");
    if (userDiv) {
        openUserMenu();
        return;
    }
    // CLOSE LOGOUT MODAL (X)
    const closeLogoutModal = e.target.closest(".close-logout-modal");
    if (closeLogoutModal) {
        closeLogoutModalController();
        return;
    }

    // CANCEL LOGOUT
    const cancelLogoutBtn = e.target.closest(".cancel-logout-btn");
    if (cancelLogoutBtn) {
        closeLogoutModalController();
        return;
    }

    // CONFIRM LOGOUT
    const confirmLogoutBtn = e.target.closest(".confirm-logout-btn");
    if (confirmLogoutBtn) {
        logoutUser();
        return;
    }
    // VIEW RANKING
    const rankingBtn = e.target.closest(".ranking-btn");
    if (rankingBtn) 
    {
        const subjectId = rankingBtn.dataset.subjectid;
        const subjectName = rankingBtn.dataset.subjectname;
        loadSubjectRanking(subjectId, subjectName);
        return;
    }
    // SAVE PROFILE BUTTON
    if (e.target.closest("#saveProfileBtn")) 
    {
    const newName = document.getElementById("editName")?.value;
    if (newName && newName.trim()) 
    {
        const saveBtn = document.querySelector("#saveProfileBtn");
        const originalText = saveBtn.innerHTML;
        
        saveBtn.innerHTML = "⏳ Saving...";
        saveBtn.disabled = true;
        saveBtn.style.opacity = "0.7";
        saveBtn.style.cursor = "wait";
        
        try {
            const result = await saveProfileChanges(newName);
            if (result.success) {
                document.getElementById("profileEditView")?.classList.add("hidden");
                document.getElementById("profileInfoView")?.classList.remove("hidden");
                showNotificationController("Profile updated successfully!", "success");
            } else {
                showNotificationController(result.error, "error");
            }
        } catch (error) {
            console.error("Error:", error);
            showNotificationController("Error saving changes", "error");
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            saveBtn.style.opacity = "1";
            saveBtn.style.cursor = "pointer";
        }
    } 
    else 
    {
        showNotificationController("Name cannot be empty", "error");
    }   
    return;
    }
});

// Cargar vista según rol
if (rol === "student") {
    loadMainStudent();
} else if (rol === "teacher") {
    loadMainTeacher();
} else if (rol === "admin") {
    loadMainAdmin();
} else {
    localStorage.clear();   
    window.location.href = "login.html";
}