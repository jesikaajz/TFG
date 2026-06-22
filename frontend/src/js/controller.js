import {
    loginUser, loginTempUser, changeMyPassword, verifyToken, logout,
    getAllUsers, getPendingUsers, assignRole, changeUserRole,
    getAllStudents, getAllTeachers, getUserById, getMyProfile, getCountAllUsers,
    createUser, deleteUser, uploadUsersExcel, downloadUsersTemplate,
    getAllSubjects, createSubject, updateSubject, deleteSubject, getCountAllSubjects,
    uploadSubjectsExcel, downloadSubjectsTemplate,
    getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear,
    getAllCourseOfferings, createCourseOffering, deleteCourseOffering,
    uploadCourseOfferingsExcel, downloadCourseOfferingsTemplate,
    getAllTeacherAssignments, createTeacherAssignment, deleteTeacherAssignment,
    uploadTeacherAssignmentsExcel, downloadTeacherAssignmentsTemplate,
    getAllEnrollments, getEnrollmentsByStudent, getMyEnrollments, createEnrollment, deleteEnrollment,
    uploadEnrollmentsExcel, uploadEnrollmentsWithUsersExcel, downloadEnrollmentsTemplate,
    getExercisesByOffering, getExercisesBySubject, getExerciseById,
    createExercise, updateExercise, deleteExercise,
    getCourseOfferingsByTeacher, getStudentsByCourseOffering,
    createSubmission, getMySubmissions, getSubmissionsByExercise, getSubmissionById,
    getEvaluationBySubmission, getEvaluationById, updateEvaluation, getEvaluationsBySubmissionIds,
    getTestResultsByEvaluation,
    getAllProgrammingLanguages, createProgrammingLanguage, deleteProgrammingLanguage,
    getCoursePassData, getStudentAvgBestNotes,getTestCaseByExercise,getLanguagesByExercise,
    getProgrammingLanguagesID,runTests,searchSubmissions,getSubmissionFilterOptions 
    ,downloadEvaluationPdf,getEvaluationPdfStatus,getSubmissionStatus,getUnreadCount,
    getConversations,getMessages,getAvailableTeachers,getUnreadNotifications,getPresence
    ,uploadChatFile,uploadMultipleChatFiles,connectChatWebSocket,sendChatMessage,onWebSocketMessage,disconnectChatWebSocket
    ,downloadChatAttachment,deleteChatMessage,deleteChatAttachment,markConversationAsRead
    ,getMySubjectRanking,getSubjectRanking,updateMyProfile,removeLanguageFromExercise,assignLanguageToExercise
    ,updateTestCase,createTestCase,deleteTestCase,createArgumentsBulk,duplicateExercise,updateArgument,getArgumentsByExercise
    ,createArgument,deleteArgument,swapArgumentPositions ,getRubricByExercise, createRubric, updateRubric, deleteRubric
    ,exportSubmissionsCSV,markMessageAsRead,getStudentsByCourseOfferingEnrollments,searchStudentsNotEnrolled
    ,enrollStudentInCourse,getTutorsByCourseOffering,getOfferingsAvailableForDuplicate,duplicateCourseOffering
    ,searchCourseOfferings,getMySubjectsByAcademicYear,assignProfessorToCourse,getAvailableProfessorsForCourse
    ,getProfessorsByCourseOffering,createTeacherAssignmentsBulk,updateCourseOffering,getUsersByRoleCount
    ,getUserSessions,updateUser,forcePasswordChange,revokeUserSession,revokeAllUserSessions,getTotalSubmissionsCount
    ,changeMyPasswordWithVerification,resetPassword,forgotPassword,deleteAllArgumentsByExercise,setTutorStatus
    ,getSystemServices,searchUsers 
    
} from "./model.js";

import {
    renderMainStudent, RenderMainAdmin, renderMainTeacher, setActiveMenu,
    renderCourses, renderExercises, renderSubmissions, renderTeacherReports,
    renderStudentReports, renderCourseExercises, renderCodingExercise,
    renderUserMenu, renderLogoutModal, closeLogoutModal,renderTestResults,
    updateEditorLanguage,updateEditorFileExtension,getEditorCode,updateRunButtonLanguage,renderSubmissionReportView,
    renderExerciseSubmissions,renderSubmissionFilters,getFilterValues,renderFilteredSubmissions,renderPdfDownloadView
    ,renderSubmissionLoadingView,renderCourseMessages,renderChatView,renderRankingView,renderMyProfile,
    renderEditExercise,showNotification,showSaveIndicator,renderCreateExercise,toggleLanguageInCreateFormUI
    ,getCreateFormArgumentsUI,getCreateFormTestCasesUI,getCreateFormSelectedLanguagesUI,deleteTestCaseFromCreateFormUI
    ,addTestCaseToCreateFormUI,addArgumentToCreateFormUI,deleteArgumentFromCreateFormUI, renderDuplicateExerciseModal, closeDuplicateModal
    ,deleteEditArgumentFromForm,addEditArgumentToForm,updateEditFormArgumentsCount,getEditFormArgumentsFromView,renderEditExerciseArguments
    ,moveArgumentUp,moveArgumentDown, addCriterionToRubricUI, removeCriterionFromRubricUI,  clearAllRubricCriteriaUI, updateRubricCriteriaCount, 
    updateRubricWeightWarning,getRubricDataFromForm,renderRubricSection,renderEmptyRubricSection,renderNotificationsDropdownView
    ,renderCourseStudents,renderEnrollStudentsList,renderEnrollStudentModal,showEnrollModalLoading,closeEnrollModal
    , renderUnenrollConfirmModal,closeUnenrollModal,setConfirmDuplicateButtonLoading,closeDuplicateOfferingModalView,updateDuplicateOfferingOfferingsList
    ,updateDuplicateOfferingModalUI,renderDuplicateCourseOfferingModal,searchProfessorsTableView,renderBulkJsonModal,downloadProfessorsTemplateUI
    ,renderCourseProfessors,renderAssignProfessorModal,setAvailableProfessorsData,renderRemoveProfessorConfirmModal,closeRemoveProfessorModal 
    ,renderAcademicStructure,renderCreateSubjectModal, renderEditSubjectModal,closeSubjectModal,renderCreateAcademicYearModal,renderEditAcademicYearModal
    ,renderCreateCourseOfferingModal,closeAcademicModal,renderDeleteSubjectConfirmModal,closeDeleteSubjectModal,filterSubjectsTableView,filterCourseOfferingsTableView
    ,renderDeleteAcademicYearConfirmModal,closeDeleteAcademicYearModal,filterAcademicYearsTableView,renderDeleteCourseOfferingConfirmModal
    ,closeDeleteCourseOfferingModal,renderEditCourseOfferingModal,renderAdminDuplicateCourseOfferingModal,updateAdminDuplicateModalUI,updateAdminOfferingsList
    ,updateAdminSelectedOfferingSummary,setAdminConfirmButtonLoading,closeAdminDuplicateModalView,updateAdminStep1NextButton,updateAdminReviewSummary
    ,updateAdminConfirmButtonState,removeExistingUserModal,renderUserManagement,renderUsersTable,renderCreateUserModal
    ,highlightActiveRoleFilter,highlightActiveStatusFilter,renderUserSessionsModal,renderDeleteUserConfirmModal,renderEditUserModal
    ,renderForcePasswordChangeModal,closeForcePasswordModal,updateUserSessionsModal,renderChangePasswordModal,closeChangePasswordModal
    ,renderConfirmModal,updateSubmissionsTableBody,renderAdminReports,renderSystemServices,renderSystemConfig
    
} from "./view.js";


//WEB SOCKET
let currentChatUserId = null;
let currentChatUserName = null;
let isChatInitialized = false;


/* ==========================================
   AUTENTICACIÓN
========================================== */

export async function login(email, password, rol) {
    const errorElement = document.getElementById("login-error");
    try {
        errorElement.textContent = "";
        if (!email || !email.trim()) throw new Error("El correo electrónico es obligatorio");
        if (!password || !password.trim()) throw new Error("La contraseña es obligatoria");
        if (!rol) throw new Error("Debes seleccionar un rol");

        // Primer intento: login normal
        await loginUser(email, password, rol);
        window.location.href = "main.html";
    } catch (error) {
        console.error("Error en login:", error);
        let errorMsg = error.message;

        // Si es error 403 y el mensaje indica que necesita cambio de contraseña
        if (errorMsg.includes("Account requires initial password change")) {
            try {
                // Intentar login temporal
                await loginTempUser(email, password, rol);
                // Si funciona, redirigir a change-password.html
                window.location.href = "change-password.html?temp=true";
                return;
            } catch (tempError) {
                console.error("Error en login temporal:", tempError);
                errorMsg = tempError.message || "No se pudo iniciar sesión con la contraseña temporal";
            }
        } else if (errorMsg.includes("Rol incorrecto")) {
            errorMsg = "El rol seleccionado no coincide con el de la cuenta.";
        } else if (errorMsg.includes("Invalid credentials")) {
            errorMsg = "Credenciales incorrectas. Verifica tu email y contraseña.";
        } else if (errorMsg.includes("Failed to fetch")) {
            errorMsg = "No se pudo conectar con el servidor. Verifica tu conexión a internet o contacta al administrador.";
        }
        errorElement.textContent = errorMsg;
    }
}

export async function confirmChangePasswordController2(currentPassword, newPassword) {
    try {
        const result = await changeMyPasswordWithVerification(currentPassword, newPassword);
        showNotificationController("Contraseña actualizada correctamente", "success");
        closeChangePasswordModal();
        await loadMyProfile();
        return { success: true };
    } catch (error) {
        console.error("Error changing password:", error);
        let errorMsg = error.message;
        // Si el error contiene el detalle de validación del backend
        if (errorMsg.includes("nueva contraseña debe ser diferente")) {
            errorMsg = "La nueva contraseña no puede ser igual a la actual";
        }
        showNotificationController(errorMsg, "error");
        return { success: false, error: errorMsg };
    }
}

export async function register(nombre, email, password, password2) {
    const errorElement2 = document.getElementById("register-error");
    try {
        errorElement2.textContent = "";
        if (password !== password2) {
            throw new Error("Las contraseñas no coinciden");
        }
        await registerUser(nombre, email, password);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error en register:", error);
        errorElement2.textContent = error.message;
    }
}

export async function loadregister() {
    window.location.href = "register.html";
}

export async function loadLogin() {
    window.location.href = "login.html";
}

export async function logoutUser() {
    try {
        await logout();
    } catch (error) {
        console.error(error);
    }
    localStorage.clear();
    window.location.href = "login.html";
}

export async function changePassword(newPassword) {
    try {
        await changeMyPassword(newPassword);
        return true;
    } catch (error) {
        console.error("Error cambiando contraseña:", error);
        throw error;
    }
}

/* ==========================================
   DASHBOARD
========================================== */

export async function loadDashboard() {
    const rol = localStorage.getItem("rol");
    
    // Verificar si necesita cambiar contraseña
    const needsPasswordChange = localStorage.getItem("password_change_required") === "true";
    if (needsPasswordChange) {
        window.location.href = "change-password.html";
        return;
    }

    if (rol === "student") loadMainStudent();
    else if (rol === "teacher") loadMainTeacher();
    else if (rol === "admin") loadMainAdmin();
}

/* ==========================================
   MAIN STUDENT
========================================== */

export async function loadMainStudent() {
    try 
    {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        // Obtener años académicos
        const academicYears = await getAcademicYears();
        if (!academicYears || academicYears.length === 0) {
            renderMainStudent([], [], "student");
            return;
        }
        
        // Determinar año académico actual
        const currentAcademicYear = academicYears.find(y => {
            if (currentMonth >= 9) {
                return y.start_year === currentYear && y.end_year === currentYear + 1;
            } else {
                return y.start_year === currentYear - 1 && y.end_year === currentYear;
            }
        });

        if (!currentAcademicYear) {
            renderMainStudent([], [], "student");
            return;
        }

        // Obtener matrículas del estudiante actual
        const enrollments = await getMyEnrollments();

        if (!enrollments || enrollments.length === 0) {
            renderMainStudent([], [], "student");
            return;
        }

        // Filtrar por año actual (por academic_year_id)
        const currentEnrollments = enrollments.filter(e => 
            e.academic_year_id === currentAcademicYear.id
        );

        if (currentEnrollments.length === 0) {
            renderMainStudent([], [], "student");
            return;
        }

        // Extraer asignaturas (subjects) de las matrículas
        const subjects = [];
        const subjectsMap = new Map();
        
        for (const enrollment of currentEnrollments) {
            for (const course of enrollment.courses || []) {
                if (!subjectsMap.has(course.course_id)) {
                    subjectsMap.set(course.course_id, {
                        id: course.course_id,
                        name: course.course_name,
                        description: course.course_description || ""
                    });
                    subjects.push(subjectsMap.get(course.course_id));
                }
            }
        }

        // Obtener ejercicios de cada offering
        const exercisesMap = new Map();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        for (const enrollment of currentEnrollments) 
        {
            for (const course of enrollment.courses || []) 
            {
                const exercises = await getExercisesByOffering(course.offering_id);
                for (const exercise of exercises) 
                {
                    const deadlineDate = new Date(exercise.deadline);
                    if (deadlineDate >= today) 
                    {
                        if (!exercisesMap.has(exercise.id)) 
                        {
                            exercisesMap.set(exercise.id, {
                                ...exercise,
                                subject_id: course.course_id,
                                subject_name: course.course_name
                            });
                        }
                    }      
                }
            }
        }

        let allExercises = Array.from(exercisesMap.values());

        allExercises.sort((a, b) => {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;   // sin fecha al final
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        const role = localStorage.getItem("rol");
        renderMainStudent(subjects, allExercises, role);
        setActiveMenu(0);

    } 
    catch (error) 
    {
        console.error("Error en loadMainStudent:", error);
    }
}

/* ==========================================
   MAIN TEACHER
========================================== */

export async function loadMainTeacher() {
    try {
        // Obtener ofertas del profesor
        const offerings = await getCourseOfferingsByTeacher();
        
        // Obtener todas las asignaturas de esas ofertas
        const subjects = [];
        const offeringMap = new Map();
        
        for (const offering of offerings) {
            offeringMap.set(offering.offering_id, offering);
            subjects.push({
                id: offering.subject_id,
                name: offering.subject_name,
                offering_id: offering.offering_id
            });
        }
        // Obtener estudiantes únicos por oferta
        const allStudents = new Map();
        for (const offering of offerings) {
            const students = await getStudentsByCourseOffering(offering.offering_id);
            for (const student of students) {
                if (!allStudents.has(student.id)) {
                    allStudents.set(student.id, student);
                }
            }
        }
        
        // Obtener todos los ejercicios de las ofertas
        let allExercises = [];
        for (const offering of offerings) {
            const exercises = await getExercisesByOffering(offering.offering_id);
            allExercises = [...allExercises, ...exercises];
        }
        
        // Obtener todas las entregas de esos ejercicios
        let allSubmissions = [];
        for (const exercise of allExercises) {
            const submissions = await getSubmissionsByExercise(exercise.id);
            allSubmissions = [...allSubmissions, ...submissions];
        }
        
        // Obtener evaluaciones y calcular avg pass rate
        let avgPassRate = 0;
        if (allSubmissions.length > 0) {
            const result = await getCoursePassData(allSubmissions);
            avgPassRate = result.passRate;
        }
        
        // Enriquecer submissions con nombres
        const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
        const enrichedSubmissions = allSubmissions.map(sub => {
            const exercise = allExercises.find(e => e.id === sub.exercise_id);
            const subjectName = subjectMap.get(exercise?.course_offering_id) || "Unknown";
            return {
                ...sub,
                exercise_name: exercise?.title || "Unknown Exercise",
                subject_name: subjectName,
                student_name: allStudents.get(sub.student_id)?.name || "Unknown Student",
                status: sub.status || "pending"
            };
        });
        const role = localStorage.getItem("rol");
        renderMainTeacher(
            offerings.length,
            allStudents.size,
            allSubmissions.length,
            avgPassRate,
            enrichedSubmissions,
            role
        );
        
        setActiveMenu(0);
    } catch (error) {
        console.error("Error en loadMainTeacher:", error);
    }
}

/* ==========================================
   MAIN ADMIN
========================================== */

export async function loadMainAdmin() {
    try {
        const users = await getCountAllUsers();
        const subjects = await getCountAllSubjects();
        const role = localStorage.getItem("rol");
        RenderMainAdmin(users, subjects, role);
        setActiveMenu(0);
    } catch (error) {
        console.error("Error en loadMainAdmin:", error);
    }
}

/* ==========================================
   COURSES (ASIGNATURAS)
========================================== */
let currentSelectedAcademicYear = null;

/* Función auxiliar para obtener estadísticas de un curso */
async function getCourseStats(offeringId) {
    try {
        // Si offeringId es undefined o null, retornar valores por defecto
        if (!offeringId) {
            console.warn("getCourseStats called with undefined offeringId");
            return { studentsCount: 0, exercisesCount: 0 };
        }
        
        // Obtener estudiantes
        const students = await getStudentsByCourseOffering(offeringId);
        const studentsCount = students.length;
        
        // Obtener ejercicios
        const exercises = await getExercisesByOffering(offeringId);
        const exercisesCount = exercises.length;
        
        return { studentsCount, exercisesCount };
    } catch (error) {
        console.error(`Error getting stats for offering ${offeringId}:`, error);
        return { studentsCount: 0, exercisesCount: 0 };
    }
}

export async function loadCourses() {
    try {
        const rol = localStorage.getItem("rol");
        
        // Obtener años académicos
        const academicYears = await getAcademicYears();
        
        if (academicYears.length === 0) {
            renderCourses([], rol, [], null);
            return;
        }
        
        // Determinar año académico actual
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        let currentAcademicYearObj = null;
        
        if (currentMonth >= 9) {
            currentAcademicYearObj = academicYears.find(y => 
                y.start_year === currentYear && y.end_year === currentYear + 1
            );
        } else {
            currentAcademicYearObj = academicYears.find(y => 
                y.start_year === currentYear - 1 && y.end_year === currentYear
            );
        }
        
        if (!currentAcademicYearObj && academicYears.length > 0) {
            currentAcademicYearObj = academicYears[0];
        }
        
        // Diferente filtrado según el rol
        let filteredAcademicYears = [];
        
        if (rol === "admin") {
            // ADMIN: MOSTRAR TODOS LOS AÑOS (pasados, actuales Y FUTUROS)
            filteredAcademicYears = [...academicYears].sort((a, b) => {
                return b.start_year - a.start_year;
            });
        } else {
            // TEACHER y STUDENT: SOLO años actuales y pasados
            const currentYearStart = currentAcademicYearObj ? currentAcademicYearObj.start_year : currentYear;
            filteredAcademicYears = academicYears.filter(year => 
                year.start_year <= currentYearStart
            ).sort((a, b) => {
                return b.start_year - a.start_year;
            });
        }
        
        // Determinar año académico seleccionado
        if (!currentSelectedAcademicYear) {
            currentSelectedAcademicYear = currentAcademicYearObj;
            // Si es admin y no hay año actual, usar el más reciente (que podría ser futuro)
            if (rol === "admin" && !currentSelectedAcademicYear && filteredAcademicYears.length > 0) {
                currentSelectedAcademicYear = filteredAcademicYears[0];
            }
        } else {
            const stillValid = filteredAcademicYears.some(y => y.id === currentSelectedAcademicYear.id);
            if (!stillValid && filteredAcademicYears.length > 0) {
                currentSelectedAcademicYear = filteredAcademicYears[0];
            }
        }
        
        let courseOfferings = [];
        
        // LÓGICA PARA ADMIN: USAR EL ENDPOINT DE BÚSQUEDA
        if (rol === "admin" && currentSelectedAcademicYear) {
            const searchResult = await searchCourseOfferings({ 
                academic_year_id: currentSelectedAcademicYear.id,
                limit: 200 
            });
            courseOfferings = searchResult.items || [];
        } 
        else if (rol === "teacher" && currentSelectedAcademicYear) {
            courseOfferings = await getMySubjectsByAcademicYear(currentSelectedAcademicYear.id);
        }
        else if (rol === "student" && currentSelectedAcademicYear) 
        {
            const enrollments = await getMyEnrollments();
            const uniqueOfferings = new Map();
            
            for (const enrollment of enrollments) 
            {
                if (enrollment.academic_year_id === currentSelectedAcademicYear?.id) 
                {
                    for (const course of enrollment.courses || []) 
                    {
                        const offeringId = course.offering_id;
                        if (!uniqueOfferings.has(offeringId)) {
                            uniqueOfferings.set(offeringId, {
                                offering_id: course.offering_id,
                                subject_id: course.course_id,
                                subject_name: course.course_name,
                                exercises_count: 0,
                                students_count: 0
                            });
                        }
                    }
                }
            }
            courseOfferings = Array.from(uniqueOfferings.values());
        }
        
        // Procesar estadísticas para cada curso
        const subjectsWithStats = [];
        for (const offering of courseOfferings) {
            // Para admin, el ID viene en 'id', no en 'offering_id'
            const offeringId = offering.offering_id || offering.id;
            
            // Si no hay ID válido, saltar esta offering
            if (!offeringId) {
                console.warn("Offering sin ID válido:", offering);
                continue;
            }
            
            const stats = await getCourseStats(offeringId);
            const studentsCount = stats.studentsCount;
            const exercisesCount = stats.exercisesCount;
            
            subjectsWithStats.push({
                id: offeringId,
                subject_id: offering.subject_id,
                name: offering.subject_name || offering.subject?.name,
                offering_id: offeringId,
                exercisesCount: exercisesCount,
                studentsCount: studentsCount,
                hasTeacher: offering.has_teacher !== undefined ? offering.has_teacher : (offering.teachers_count > 0 || false),
                has_past_offerings: offering.has_past_offerings || false,
                past_offerings_count: offering.past_offerings_count || 0
            });
        }
        
        renderCourses(subjectsWithStats, rol, filteredAcademicYears, currentSelectedAcademicYear);
        
    } catch (error) {
        console.error("Error en loadCourses:", error);
        renderCourses([], localStorage.getItem("rol"), [], null);
    }
}

/* Función auxiliar para obtener año académico actual */
async function getCurrentAcademicYear(academicYears) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let currentAcademicYear = null;
    
    if (currentMonth >= 9) {
        currentAcademicYear = academicYears.find(y => 
            y.start_year === currentYear && y.end_year === currentYear + 1
        );
    } else {
        currentAcademicYear = academicYears.find(y => 
            y.start_year === currentYear - 1 && y.end_year === currentYear
        );
    }
    
    // Si no encuentra el año actual, usar el más reciente
    if (!currentAcademicYear && academicYears.length > 0) {
        currentAcademicYear = academicYears[0];
    }
    
    return currentAcademicYear;
}

/* Cambiar año académico */
export async function changeAcademicYear(academicYearId) {
    try {
        const academicYears = await getAcademicYears();
        const selectedYear = academicYears.find(y => y.id === parseInt(academicYearId));
        
        if (selectedYear) {
            currentSelectedAcademicYear = selectedYear;
            await loadCourses(); // Recargar cursos
        }
    } catch (error) {
        console.error("Error changing academic year:", error);
        showNotificationController("Error al cambiar el año académico", "error");
    }
}

/* Obtener año académico seleccionado actualmente */
export function getCurrentSelectedAcademicYear() {
    return currentSelectedAcademicYear;
}
// ==========================================
// CACHÉ DE COURSE OFFERINGS
// ==========================================
let courseOfferingsCache = null;

async function getCourseOfferingsCache() {
    if (!courseOfferingsCache) {
        try {
            const [offerings, subjects, academicYears] = await Promise.all([
                getAllCourseOfferings(),
                getAllSubjects(),
                getAcademicYears()
            ]);
            const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
            const yearMap = new Map(academicYears.map(y => [y.id, `${y.start_year}-${y.end_year}`]));
            courseOfferingsCache = offerings.map(off => ({
                ...off,
                subject_name: subjectMap.get(off.subject_id) || "Unknown",
                academic_year: yearMap.get(off.academic_year_id) || "Unknown"
            }));
        } catch (e) {
            console.error("Error loading course offerings cache", e);
            courseOfferingsCache = [];
        }
    }
    return courseOfferingsCache;
}

// ==========================================
//  EXERCISES 
// ==========================================
export async function loadExercises() {
    try {
        const rol = localStorage.getItem("rol");
        let exercisesMap = new Map();
        let exercises = [];
        let subjects = [];
        
        // Obtener caché de course offerings para el año académico
        const offerings = await getCourseOfferingsCache();
        const offeringYearMap = new Map();
        offerings.forEach(off => {
            let year = off.academic_year;
            if (!year && off.academic_year_start && off.academic_year_end) {
                year = `${off.academic_year_start}-${off.academic_year_end}`;
            }
            offeringYearMap.set(off.id, year || 'Unknown');
        });
        
        if (rol === "student") {
            const enrollments = await getMyEnrollments();
            const subjectsMap = new Map();
            
            for (const enrollment of enrollments) {
                for (const course of enrollment.courses || []) {
                    if (!subjectsMap.has(course.course_id)) {
                        subjectsMap.set(course.course_id, {
                            id: course.course_id,
                            name: course.course_name
                        });
                    }
                    const exs = await getExercisesByOffering(course.offering_id);
                    for (const ex of exs) {
                        if (!exercisesMap.has(ex.id)) {
                            exercisesMap.set(ex.id, {
                                ...ex,
                                subject_id: course.course_id,
                                academic_year: offeringYearMap.get(course.offering_id) || 'Unknown'
                            });
                        }
                    }
                }
            }
            subjects = Array.from(subjectsMap.values());
            exercises = Array.from(exercisesMap.values());
        } 
        else if (rol === "teacher") {
            const teacherOfferings = await getCourseOfferingsByTeacher();
            const subjectsMap = new Map();
            
            for (const offering of teacherOfferings) {
                if (!subjectsMap.has(offering.subject_id)) {
                    subjectsMap.set(offering.subject_id, {
                        id: offering.subject_id,
                        name: offering.subject_name
                    });
                }
                const exs = await getExercisesByOffering(offering.offering_id);
                for (const ex of exs) {
                    exercises.push({
                        ...ex,
                        subject_id: offering.subject_id,
                        academic_year: offeringYearMap.get(offering.offering_id) || 'Unknown'
                    });
                }
            }
            subjects = Array.from(subjectsMap.values());

            exercises.sort((a, b) => {
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            });
        }
        else if (rol === "admin") {
            const [offeringsWithYear, allSubjects] = await Promise.all([
                getCourseOfferingsCache(),   // Ya incluye academic_year
                getAllSubjects()
            ]);

            const subjectMap = new Map();
            allSubjects.forEach(subj => {
                subjectMap.set(subj.id, subj.name);
            });

            const subjectsMap = new Map();
            const exercisesSet = new Map();

            for (const offering of offeringsWithYear) {
                const subjectId = offering.subject_id;
                if (!subjectId) continue;

                if (!subjectsMap.has(subjectId)) {
                    const subjectName = subjectMap.get(subjectId) || `Subject ${subjectId}`;
                    subjectsMap.set(subjectId, {
                        id: subjectId,
                        name: subjectName
                    });
                }

                const exs = await getExercisesByOffering(offering.id);
                for (const ex of exs) {
                    if (!exercisesSet.has(ex.id)) {
                        exercisesSet.set(ex.id, {
                            ...ex,
                            subject_id: subjectId,
                            academic_year: offering.academic_year   // Ahora sí tiene el año
                        });
                    }
                }
            }

            subjects = Array.from(subjectsMap.values());
            exercises = Array.from(exercisesSet.values());

            exercises.sort((a, b) => {
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            });
        }
        
        const mySubmissions = rol === "student" ? await getMySubmissions() : [];
        const latestMap = getLatestStatusPerExercise(mySubmissions);
        
        const exercisesWithStatus = exercises.map(ex => {
            const latest = latestMap[ex.id];
            const now = new Date();
            const hasDeadline = ex.deadline && ex.deadline !== "null";
            const deadline = hasDeadline ? new Date(ex.deadline) : null;

            const isClosed = hasDeadline ? deadline < now : false;
            const exerciseSubmissions = mySubmissions.filter(s => Number(s.exercise_id) === Number(ex.id));
            return {
                ...ex,
                isClosed,
                hasSubmission: exerciseSubmissions.length > 0,
                submissions: exerciseSubmissions,
                submissionStatus: latest ? latest.status : null
            };
        });

        if (rol === "student") {
            exercisesWithStatus.sort((a, b) => {
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            });
        }

        renderExercises(exercisesWithStatus, subjects, rol);
    } catch (error) {
        console.error("Error en loadExercises:", error);
    }
}

function getLatestStatusPerExercise(submissions) {
    const map = {};
    submissions.forEach(sub => {
        const key = sub.exercise_id;
        if (!map[key] || new Date(sub.submitted_at) > new Date(map[key].submitted_at)) {
            map[key] = sub;
        }
    });
    return map;
}

export function searchExercisesController(searchTerm) {
    const rows = document.querySelectorAll("#exercisesGroupsContainer .exercises-table tbody tr");
    const searchLower = searchTerm.trim().toLowerCase();
    
    rows.forEach(row => {
        // Obtener solo el título del ejercicio (primera celda, dentro de .exercise-name)
        const exerciseNameElem = row.querySelector("td:first-child .exercise-name");
        let exerciseName = exerciseNameElem ? exerciseNameElem.textContent.trim() : "";
        exerciseName = exerciseName.toLowerCase();
        
        let matches = false;
        
        if (searchTerm.trim() === "") {
            matches = true;
        } else {
            // Dividir el título en palabras (separadas por espacios)
            const words = exerciseName.split(/\s+/);
            // Buscar si alguna palabra comienza exactamente con el término buscado
            matches = words.some(word => word.startsWith(searchLower));
        }
        
        // Mostrar u ocultar la fila
        row.style.display = matches ? "" : "none";
        
        // Si la fila es visible, asegurar que su grupo también lo sea
        if (matches) {
            const groupCard = row.closest(".exercise-group-card");
            if (groupCard) groupCard.style.display = "";
        }
    });
    
    // Ocultar grupos sin ninguna fila visible
    const groupCards = document.querySelectorAll("#exercisesGroupsContainer .exercise-group-card");
    groupCards.forEach(card => {
        const anyVisible = Array.from(card.querySelectorAll("tbody tr")).some(row => row.style.display !== "none");
        card.style.display = anyVisible ? "" : "none";
    });
}

/* ==========================================
   SUBMISSIONS
========================================== */
let currentSearchType = "student";
let currentSearchTerm = "";
export async function loadSubmissions(academicYearId = null) {
    try {
        const rol = localStorage.getItem("rol");

        let submissions = [];
        let exercises = [];
        let subjects = [];
        let evaluations = [];
        let users = [];

        if (rol === "student") {
            currentSearchType = "exercise";

            submissions = await getMySubmissions();

            const exerciseIds = [...new Set(submissions.map(s => s.exercise_id))];

            // Obtener ejercicios de forma segura (manejar 403)
            const exercisePromises = exerciseIds.map(async (exId) => {
                try {
                    const ex = await getExerciseById(exId);
                    return ex;
                } catch (error) {
                    console.log(`Could not fetch exercise ${exId}:`, error.message);
                    return null;
                }
            });

            const exerciseResults = await Promise.all(exercisePromises);
            exercises = exerciseResults.filter(ex => ex !== null);

            const validExerciseIds = new Set(exercises.map(ex => ex.id));
            submissions = submissions.filter(sub => validExerciseIds.has(sub.exercise_id));

            // ========== ORDENAR SUBMISSIONS POR FECHA (más reciente primero) ==========
            submissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

            const offerings = await getAllCourseOfferings();
            const subjectsData = await getAllSubjects();

            subjects = offerings.map(offering => {
                const subject = subjectsData.find(s => s.id === offering.subject_id);
                return {
                    offering_id: offering.id,
                    subject_id: offering.subject_id,
                    name: subject?.name || "Unknown"
                };
            });

            const evalPromises = submissions.map(async s => {
                try {
                    const evaluation = await getEvaluationBySubmission(s.id);
                    let languageName = "Unknown";
                    if (s.language_id) {
                        try {
                            const language = await getProgrammingLanguagesID(s.language_id);
                            languageName = language.name || "Unknown";
                        } catch (langErr) { }
                    }
                    return { submissionId: s.id, evaluation, languageName };
                } catch (err) {
                    return { submissionId: s.id, evaluation: null, languageName: "Unknown" };
                }
            });

            const results = await Promise.all(evalPromises);
            evaluations = results.filter(r => r.evaluation !== null).map(r => r.evaluation);
            for (const result of results) {
                const submission = submissions.find(s => s.id === result.submissionId);
                if (submission) submission.language_name = result.languageName;
            }
        }
        else if (rol === "teacher") {

            const offerings = await getCourseOfferingsByTeacher();

            for (const offering of offerings) {
                const exs = await getExercisesByOffering(offering.offering_id);
                exercises = [...exercises, ...exs];
            }

            const exerciseIds = exercises.map(e => e.id);
            let allSubmissions = [];

            for (const exId of exerciseIds) {
                const subs = await getSubmissionsByExercise(exId);
                allSubmissions = [...allSubmissions, ...subs];
            }

            submissions = allSubmissions;
            // ========== ORDENAR SUBMISSIONS POR FECHA (más reciente primero) ==========
            submissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

            const userIds = [...new Set(submissions.map(s => s.student_id))];
            for (const uid of userIds) {
                const user = await getUserById(uid);
                users.push(user);
            }

            const evalPromises = submissions.map(async s => {
                try {
                    const evaluation = await getEvaluationBySubmission(s.id);
                    let languageName = "Unknown";
                    if (s.language_id) {
                        try {
                            const language = await getProgrammingLanguagesID(s.language_id);
                            languageName = language.name || "Unknown";
                        } catch (langErr) { }
                    }
                    return { submissionId: s.id, evaluation, languageName };
                } catch (err) {
                    return { submissionId: s.id, evaluation: null, languageName: "Unknown" };
                }
            });

            const results = await Promise.all(evalPromises);
            evaluations = results.filter(r => r.evaluation !== null).map(r => r.evaluation);
            for (const result of results) {
                const submission = submissions.find(s => s.id === result.submissionId);
                if (submission) submission.language_name = result.languageName;
            }

            subjects = offerings.map(o => ({
                offering_id: o.offering_id,
                subject_id: o.subject_id,
                name: o.subject_name
            }));
        }
        else if (rol === "admin") {
            // Obtener datos frescos
            const [allOfferings, allSubjects, academicYears] = await Promise.all([
                getAllCourseOfferings(),
                getAllSubjects(),
                getAcademicYears()
            ]);

            const subjectMap = new Map(allSubjects.map(s => [s.id, s.name]));
            const yearMap = new Map(academicYears.map(y => [y.id, `${y.start_year}-${y.end_year}`]));

            // Filtrar ofertas por año académico si se proporciona
            let filteredOfferings = allOfferings;
            if (academicYearId) {
                filteredOfferings = allOfferings.filter(off => off.academic_year_id === parseInt(academicYearId));
            }

            // Obtener ejercicios de las ofertas filtradas
            let allExercises = [];
            for (const offering of filteredOfferings) {
                const exs = await getExercisesByOffering(offering.id);
                const enrichedExs = exs.map(ex => ({
                    ...ex,
                    subject_name: subjectMap.get(offering.subject_id) || "Unknown",
                    subject_id: offering.subject_id,
                    academic_year: yearMap.get(offering.academic_year_id) || "Unknown",
                    offering_id: offering.id
                }));
                allExercises.push(...enrichedExs);
            }
            exercises = allExercises;

            // Obtener submissions de esos ejercicios
            let allSubmissions = [];
            for (const exercise of exercises) {
                const subs = await getSubmissionsByExercise(exercise.id);
                const enrichedSubs = subs.map(sub => ({
                    ...sub,
                    exercise_title: exercise.title,
                    subject_name: exercise.subject_name,
                    subject_id: exercise.subject_id,
                    academic_year: exercise.academic_year,
                    offering_id: exercise.offering_id
                }));
                allSubmissions.push(...enrichedSubs);
            }
            submissions = allSubmissions;
            submissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

            // Obtener usuarios (estudiantes)
            const userIds = [...new Set(submissions.map(s => s.student_id))];
            const userPromises = userIds.map(id => getUserById(id).catch(() => null));
            const userResults = await Promise.all(userPromises);
            users = userResults.filter(u => u !== null);

            const userMap = new Map();
            userResults.forEach(user => {
                if (user) userMap.set(user.id, user.name);
            });
            submissions = submissions.map(sub => ({
                ...sub,
                student_name: userMap.get(sub.student_id) || "Unknown"
            }));

            // Evaluaciones y lenguajes
            const evalPromises = submissions.map(async s => {
                try {
                    const evaluation = await getEvaluationBySubmission(s.id);
                    let languageName = "Unknown";
                    if (s.language_id) {
                        try {
                            const lang = await getProgrammingLanguagesID(s.language_id);
                            languageName = lang.name;
                        } catch (err) {}
                    }
                    return { submissionId: s.id, evaluation, languageName };
                } catch (err) {
                    return { submissionId: s.id, evaluation: null, languageName: "Unknown" };
                }
            });
            const evalResults = await Promise.all(evalPromises);
            evaluations = evalResults.filter(r => r.evaluation !== null).map(r => r.evaluation);
            for (const result of evalResults) {
                const sub = submissions.find(s => s.id === result.submissionId);
                if (sub) {
                    sub.language_name = result.languageName || "Unknown";
                }
            }

            // Asignaturas únicas
            const subjectsMap = new Map();
            for (const sub of submissions) {
                if (sub.subject_id && !subjectsMap.has(sub.subject_id)) {
                    subjectsMap.set(sub.subject_id, { id: sub.subject_id, name: sub.subject_name });
                }
            }
            subjects = Array.from(subjectsMap.values());

            // Actualizar caché global para búsquedas
            allSubmissionsData = [...submissions];
            allSubmissionsExercises = [...exercises];
            allSubmissionsSubjects = [...subjects];
            allSubmissionsEvaluations = [...evaluations];
            allSubmissionsUsers = [...users];
        }
        
        const allAcademicYears = await getAcademicYears();
        renderSubmissions(submissions, exercises, subjects, evaluations, users, rol, allAcademicYears, academicYearId, currentSearchType, currentSearchTerm);
    } catch (error) {
        console.error("Error en loadSubmissions:", error);
    }
}

/* ==========================================
   REPORTS
========================================== */
export async function loadReports() {
    try {
        const rol = localStorage.getItem("rol");
        
        if (rol === "teacher") {
            const offerings = await getCourseOfferingsByTeacher();
            const reportData = [];
            
            // Usar un mapa para agrupar por subject_name (opcional)
            const courseMap = new Map();
            
            for (const offering of offerings) {
                // Obtener estudiantes
                const students = await getStudentsByCourseOffering(offering.offering_id);
                const totalStudents = students.length;
                if (totalStudents === 0) continue; // Saltar cursos sin estudiantes
                
                // Obtener ejercicios
                const exercises = await getExercisesByOffering(offering.offering_id);
                if (exercises.length === 0) continue; // Saltar cursos sin ejercicios
                
                // Obtener todas las submissions de los ejercicios
                let allSubmissions = [];
                for (const ex of exercises) {
                    const subs = await getSubmissionsByExercise(ex.id);
                    allSubmissions = [...allSubmissions, ...subs];
                }
                
                // Verificar si al menos una submission tiene evaluación (score)
                let hasEvaluation = false;
                for (const sub of allSubmissions) {
                    try {
                        const evaluation = await getEvaluationBySubmission(sub.id);
                        if (evaluation && evaluation.score !== undefined) {
                            hasEvaluation = true;
                            break;
                        }
                    } catch (err) {
                        // Si no tiene evaluación, continuar
                    }
                }
                
                // Si no hay evaluaciones, saltar este curso
                if (!hasEvaluation) continue;
                
                // Calcular métricas (solo con submissions evaluadas)
                const result = await getCoursePassData(allSubmissions);
                
                // Agrupar por subject_name (si quieres evitar duplicados)
                const key = offering.subject_name;
                if (courseMap.has(key)) {
                    // Si ya existe, podrías promediar o sumar, pero mejor mantenerlo simple
                    // Aquí decidimos no agrupar, pero podrías hacerlo si quieres.
                }
                
                reportData.push({
                    course: offering.subject_name,
                    totalStudents: totalStudents,
                    totalSubmissions: allSubmissions.length,
                    totalPassed: result.totalPassed,
                    passRate: result.passRate,
                    averageGrade: result.averageGrade
                });
            }
            
            // Opcional: ordenar por nombre de curso
            reportData.sort((a, b) => a.course.localeCompare(b.course));
            
            renderTeacherReports(reportData);
        } 
        else if (rol === "student") 
        {
            const reportData = await buildStudentReportData();
            console.log(reportData);
            renderStudentReports(reportData);
        }
        else if (rol === "admin") {
            const reportData = await getAdminReportData();
            renderAdminReports(reportData);
        }
    } catch (error) {
        console.error("Error en loadReports:", error);
    }
}

/* STUDENT REPORT */
async function buildStudentReportData()
{
    const submissions = await getMySubmissions();
    const gradeEvolution = [];
    const gradesByCourse = [];
    const courseScores = new Map();
    const bestExerciseScores = new Map();

    let completed = 0;
    let submitted = 0;

    for (const sub of submissions)
    {
        let exercise = null;
        try {
            exercise = await getExerciseById(sub.exercise_id);
        } catch (error) {
            // Ejercicio oculto o no existe - saltar silenciosamente
            continue;
        }

        let evaluation = null;
        try {
            evaluation = await getEvaluationBySubmission(sub.id);
        } catch (err) {
            // Aún no tiene evaluación - contar como "submitted" (pendiente de evaluación)
            submitted++;
            continue;
        }

        if (!evaluation || evaluation.score === undefined)
        {
            submitted++;
            continue;
        }

        completed++;

        const score = evaluation.score;

        if (
            !bestExerciseScores.has(sub.exercise_id) ||
            score > bestExerciseScores.get(sub.exercise_id).grade
        )
        {
            bestExerciseScores.set(sub.exercise_id, {
                exercise: exercise.title,
                grade: score,
                courseOfferingId: exercise.course_offering_id
            });
        }
    }

    for (const data of bestExerciseScores.values())
    {
        gradeEvolution.push({
            exercise: data.exercise,
            grade: data.grade
        });

        if (!courseScores.has(data.courseOfferingId))
        {
            courseScores.set(data.courseOfferingId, []);
        }

        courseScores.get(data.courseOfferingId).push(data.grade);
    }

    const enrollments = await getMyEnrollments();

    let totalExercises = 0;
    const processedCourses = new Set();

   for (const enrollment of enrollments)
    {
        for (const course of (enrollment.courses || []))
        {
            if (processedCourses.has(course.offering_id)) continue;
            processedCourses.add(course.offering_id);

            let exercises = [];
            try {
                exercises = await getExercisesByOffering(course.offering_id);
            } catch (error) {
                continue;
            }

            const visibleExercises = exercises.filter(ex => ex.visibility === true);
            totalExercises += visibleExercises.length;

            const scores = courseScores.get(course.offering_id) || [];
            if (scores.length === 0) continue;  
            const average = scores.length > 0
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : 0;

            gradesByCourse.push({
                course: course.course_name,
                average: Number(average.toFixed(1))
            });
        }
    }

    const pending = totalExercises - completed - submitted;

    return {
        gradeEvolution,
        gradesByCourse,
        statusData: {
            completed,
            submitted,
            pending: pending < 0 ? 0 : pending
        }
    };
}
/* ==========================================
   COURSE EXERCISES
========================================== */
let currentCourseOrigin = null;

export async function loadCourseExercises(offeringId, from = "courses", updateOrigin = true, subjectIdParam = null) {
    try {
        let subjectName = "";
        let subjectId = null;
        const rol = localStorage.getItem("rol");

        if (!offeringId) {
            console.error("No offeringId provided");
            loadCourses();
            return;
        }

        const offeringIdNum = parseInt(offeringId);
        
        if (updateOrigin) {
            currentCourseOrigin = from;
        }
        const displayFrom = currentCourseOrigin || from;
        
        // Obtener información del course offering según el rol
        if (rol === "student") {
            const enrollments = await getMyEnrollments();
            let found = false;
            for (const enrollment of enrollments) {
                for (const course of (enrollment.courses || [])) {
                    if (Number(course.offering_id) === offeringIdNum) {
                        subjectName = course.course_name;
                        subjectId = course.course_id;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (!subjectName) {
                try {
                    const allOfferings = await getAllCourseOfferings();
                    const offering = allOfferings.find(o => o.id === offeringIdNum);
                    if (offering && offering.subject) {
                        subjectName = offering.subject.name;
                        subjectId = offering.subject_id;
                    } else {
                        loadCourses();
                        return;
                    }
                } catch (err) {
                    loadCourses();
                    return;
                }
            }
        } 
        else if (rol === "teacher") {
            const offerings = await getCourseOfferingsByTeacher();
            const offering = offerings.find(o => Number(o.offering_id) === offeringIdNum);
            if (offering) {
                subjectName = offering.subject_name;
                subjectId = offering.subject_id;
            } else {
                try {
                    const allOfferings = await getAllCourseOfferings();
                    const foundOffering = allOfferings.find(o => o.id === offeringIdNum);
                    if (foundOffering && foundOffering.subject) {
                        subjectName = foundOffering.subject.name;
                        subjectId = foundOffering.subject_id;
                    } else {
                        loadCourses();
                        return;
                    }
                } catch (err) {
                    loadCourses();
                    return;
                }
            }
        }
        else if (rol === "admin") {
            try {
                const allOfferings = await getAllCourseOfferings();
                const offering = allOfferings.find(o => o.id === offeringIdNum);
                if (offering) {
                    if (offering.subject_id) {
                        const subjects = await getAllSubjects();
                        const subject = subjects.find(s => s.id === offering.subject_id);
                        subjectName = subject?.name || `Subject ${offering.subject_id}`;
                        subjectId = offering.subject_id;
                    } else {
                        subjectName = `Course ${offeringIdNum}`;
                    }
                } else {
                    loadCourses();
                    return;
                }
            } catch (err) {
                loadCourses();
                return;
            }
        }
        
        // Obtener ejercicios del course offering
        let ejercicios = await getExercisesByOffering(offeringIdNum);
        
        // Añadir año académico a cada ejercicio
        const offerings = await getCourseOfferingsCache();
        const offeringData = offerings.find(o => o.id === offeringIdNum);
        let academicYear = 'Unknown';
        if (offeringData) {
            academicYear = offeringData.academic_year;
            if (!academicYear && offeringData.academic_year_start && offeringData.academic_year_end) {
                academicYear = `${offeringData.academic_year_start}-${offeringData.academic_year_end}`;
            }
        }
        ejercicios = ejercicios.map(ex => ({
            ...ex,
            academic_year: academicYear
        }));
        
        // Procesar según el rol
        if (rol === "student") {
            const mySubmissions = await getMySubmissions();
            const currentDate = new Date();
            for (const exercise of ejercicios) {
                const isVisible = exercise.is_visible !== false && exercise.visibility !== false;
                if (!isVisible) {
                    exercise.hidden = true;
                    continue;
                }
                exercise.hidden = false;
                if (!exercise.deadline) {
                    exercise.expired = false;
                } else {
                    const deadline = new Date(exercise.deadline);
                    exercise.expired = deadline < currentDate;
                }
                exercise.submissions = mySubmissions.filter(s => Number(s.exercise_id) === Number(exercise.id));
            }
        } 
        else if (rol === "teacher") {
            const currentDate = new Date();
            for (const exercise of ejercicios) {
                if (!exercise.deadline) {
                    exercise.expired = false;
                } else {
                    const deadline = new Date(exercise.deadline);
                    exercise.expired = deadline < currentDate;
                }
                exercise.submissions = [];
            }
        }
        
        let ejerciciosFiltrados = rol === "student" 
            ? ejercicios.filter(ex => !ex.hidden)
            : ejercicios;

        ejerciciosFiltrados.sort((a, b) => {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
        
        const unreadData = await getUnreadCount();
        
        renderCourseExercises(ejerciciosFiltrados, subjectName, displayFrom, offeringIdNum, unreadData.unread_count || 0, rol, subjectId);
        
    } catch (error) {
        console.error("Error al cargar los ejercicios:", error);
        loadCourses();
    }
}

// ==========================================
// ELIMINAR EJERCICIO 
// ==========================================
export async function deleteExerciseController(exerciseId, exerciseTitle) {
    try {
        await deleteExercise(exerciseId);
        showNotificationController(`Ejercicio "${exerciseTitle}" eliminado correctamente`, "success");
        await loadExercises();
        return { success: true };
    } catch (error) {
        console.error("Error deleting exercise:", error);
        let errorMsg = error.message;
        if (errorMsg.includes("foreign key") || errorMsg.includes("submissions") || errorMsg.includes("evaluations")) {
            errorMsg = "No se puede eliminar el ejercicio porque tiene entregas o evaluaciones asociadas.";
        }
        showNotificationController(errorMsg, "error");
        return { success: false, error: errorMsg };
    }
}

export function confirmDeleteExerciseController(exerciseId, exerciseTitle) {
    renderConfirmModal(
        "Delete Exercise",
        `Are you sure you want to delete the exercise "${exerciseTitle}"? This action cannot be undone.`,
        "Yes, Delete",
        "Cancel",
        async () => {
            // Callback de confirmación
            try {
                await deleteExercise(exerciseId);
                showNotificationController(`Exercise "${exerciseTitle}" deleted successfully`, "success");
                await loadExercises();  // Recargar lista
            } catch (error) {
                console.error("Error deleting exercise:", error);
                let errorMsg = error.message;
                if (errorMsg.includes("foreign key") || errorMsg.includes("submissions") || errorMsg.includes("evaluations")) {
                    errorMsg = "Cannot delete exercise because it has associated submissions or evaluations.";
                }
                showNotificationController(errorMsg, "error");
            }
        },
        () => {
            // Callback de cancelación (opcional)
            console.log("Deletion cancelled");
        }
    );
}
/* ==========================================
   CODING EXERCISE
========================================== */
export async function loadCodingExercise(exerciseId, source, courseId = null) {
    try {
        const exercise = await getExerciseById(exerciseId);
        const test_cases = await getTestCaseByExercise(exerciseId);
        const languages = await getLanguagesByExercise(exerciseId);
        
        let argumentsData = [];
        if (exercise.evaluation_mode === "function_calls") {
            try {
                argumentsData = await getArgumentsByExercise(exerciseId);
                console.log("Arguments loaded for exercise:", argumentsData);
                // ACTUALIZAR LA CACHÉ GLOBAL
                if (typeof window !== 'undefined') {
                    window.currentArgumentsCache = argumentsData;
                }
            } catch (err) {
                console.log("No arguments found or error loading:", err);
                if (typeof window !== 'undefined') {
                    window.currentArgumentsCache = [];
                }
            }
        } else {
            if (typeof window !== 'undefined') {
                window.currentArgumentsCache = [];
            }
        }
        
        const uniqueLanguageIds = [...new Set(languages.map(lang => lang.language_id))];
        const programming_lang = await Promise.all(
            uniqueLanguageIds.map(id => getProgrammingLanguagesID(id))
        );
        
        renderCodingExercise(
            exercise, 
            test_cases, 
            programming_lang, 
            source, 
            courseId,
            argumentsData
        );
    } catch (error) {
        console.error("Error loading coding exercise:", error);
    }
}

/* ==========================================
   USER MENU
========================================== */

export async function openUserMenu() {
    try {
        const rol = localStorage.getItem("rol");
        const user = await getMyProfile();
        renderUserMenu(user, rol);
    } catch (error) {
        console.error(error);
    }
}

export async function openLogoutModal() {
    renderLogoutModal();
}

export async function closeLogoutModalController() {
    closeLogoutModal();
}

/* ==========================================
   RUN TEST
========================================== */
export async function runCodingTestsController(exerciseId, languageId) {
    try {
        setLoadingState(true, ".run-btn, .submit-btn");
        
        const code = getEditorCode();
        const results = await runTests({
            exercise_id: Number(exerciseId),
            language_id: Number(languageId),
            code: code
        });
        
        renderTestResults(results);
    } catch (error) {
        console.error("Error running tests:", error);
        renderTestResults({
            error: true,
            message: "Error running tests"
        });
    } finally {
        setLoadingState(false, ".run-btn, .submit-btn");
    }
}

// Función para mostrar/ocultar cursor de carga y deshabilitar botones
function setLoadingState(isLoading, buttonsSelector = ".run-btn, .submit-btn") {
    const buttons = document.querySelectorAll(buttonsSelector);
    if (isLoading) {
        document.body.classList.add("loading");
        buttons.forEach(btn => {
            btn.classList.add("loading-btn");
            btn.disabled = true;
        });
    } else {
        document.body.classList.remove("loading");
        buttons.forEach(btn => {
            btn.classList.remove("loading-btn");
            btn.disabled = false;
        });
    }
}
/* ==========================================
   CHANGE EDITOR LANGUAGE
========================================== */
export function handleLanguageChange(selector, argumentsData = null, returnType = null) {
    const newLanguage = selector.value;
    const selectedOption = selector.options[selector.selectedIndex];
    const languageId = selectedOption.dataset.languageId;
    
    // Usar argumentos y tipo de retorno pasados, o los de la caché global
    const args = argumentsData !== null ? argumentsData : currentArgumentsCache;
    const retType = returnType !== null ? returnType : currentReturnTypeCache;
    
    updateEditorLanguage(newLanguage, args, retType);
    updateEditorFileExtension(newLanguage);
    updateRunButtonLanguage(languageId);
}


/* ======================================
   SUBMIT SOLUTION
====================================== */
export async function submitCodingExerciseController(
    exerciseId,
    languageId
)
{
    try
    {
        renderSubmissionLoadingView(
            0,
            "Creating submission..."
        );

        const code = getEditorCode();

        const submission =
            await createSubmission({
                exercise_id: Number(exerciseId),
                language_id: Number(languageId),
                code
            });

        let completed = false;

        while (!completed)
        {
            await new Promise(resolve =>
                setTimeout(resolve, 2000)
            );

            const status =
                await getSubmissionStatus(
                    submission.id
                );

            renderSubmissionLoadingView(
                status.progress,
                status.message,
                status.detailed_status
            );

            if (
                status.detailed_status ===
                "completed"
            )
            {
                completed = true;

                await loadSubmissionReportController(
                    submission.id
                );
            }

            if (
                status.detailed_status ===
                "error"
            )
            {
                throw new Error(
                    "Evaluation failed"
                );
            }
        }
    }
    catch(error)
    {
        console.error(
            "Submit error:",
            error
        );
    }
}

export async function loadSubmissionReportController(submissionId, from = "submissions") {
    try {
        const evaluation = await getEvaluationBySubmission(submissionId);
        const testResults = await getTestResultsByEvaluation(evaluation.id);
        const submission = await getSubmissionById(submissionId);
        const exercise = await getExerciseById(submission.exercise_id);
        const testcases = await getTestCaseByExercise(submission.exercise_id);
        const pdfStatus = await getEvaluationPdfStatus(submissionId);

        renderSubmissionReportView(submission, evaluation, testResults, exercise, testcases, pdfStatus, from);
    } catch (err) {
        console.error("Error loading report:", err);
    }
}

/*DOWNLOAD PDF*/
export async function downloadEvaluationPdfController(submissionId)
{
    try
    {
        // model
        const pdfBlob = await downloadEvaluationPdf(submissionId);

        if (!pdfBlob)
        {
            return;
        }

        // view
        renderPdfDownloadView(pdfBlob,submissionId);
    }
    catch(error)
    {
        console.error(
            "Error downloading PDF:",
            error
        );
    }
}

export async function loadExerciseSubmissions(exerciseId, from = "exercises", subjectId = null)
{
    try
    {
        const rol = localStorage.getItem("rol");
        const exercise = await getExerciseById(exerciseId);
        const courses = await getAllSubjects();
        const courses_offering = await getAllCourseOfferings();
        
        let submissions = [];
        let evaluations = [];

        if (rol === "student")
        {
            // Lógica para estudiante (existente)
            const allSubmissions = await getMySubmissions();
            submissions = allSubmissions.filter(sub => sub.exercise_id == exerciseId);
            for (const sub of submissions) {
                try {
                    const evaluation = await getEvaluationBySubmission(sub.id);
                    if (evaluation) evaluations.push(evaluation);
                } catch(err) {}
            }
        }
        else if (rol === "teacher" || rol === "admin")
        {
            // Lógica para profesor y admin
            submissions = await getSubmissionsByExercise(exerciseId);
            for (const sub of submissions) {
                try {
                    const evaluation = await getEvaluationBySubmission(sub.id);
                    if (evaluation) evaluations.push(evaluation);
                    if (sub.student_id) {
                        try {
                            const student = await getUserById(sub.student_id);
                            sub.student_name = student.name || "Unknown Student";
                        } catch(err) {
                            sub.student_name = "Unknown Student";
                        }
                    }
                } catch(err) {
                    console.log(`Submission ${sub.id} still processing or no evaluation yet`);
                }
            }
        }
        
        renderExerciseSubmissions(submissions, exercise, courses, courses_offering, evaluations, from, subjectId, rol);
    }
    catch (err)
    {
        console.error("Error loading exercise submissions:", err);
    }
}
let lastFiltersCount = 0;
let currentFilters = {};
let currentSearch = "";

/* PINTAR EL FILTRO*/
export async function loadSubmissionFilters() 
{
    const filterOptions = await getSubmissionFilterOptions();

    renderSubmissionFilters(
        currentFilters,
        filterOptions
    );
}


function filterSubmissionsByStartsWith(items, searchTerm, field) {
    if (!searchTerm || !field) return items;
    const searchLower = searchTerm.trim().toLowerCase();
    return items.filter(item => {
        const value = (item[field] || "").toLowerCase();
        const words = value.split(/\s+/);
        return words.some(word => word.startsWith(searchLower));
    });
}

export async function applySubmissionFiltersController(keepView = false) {
    let filters;
    if (keepView && currentFilters && Object.keys(currentFilters).length > 0) {
        filters = currentFilters;
    } else {
        filters = getFilterValues();
        currentFilters = filters;
    }

    const rol = localStorage.getItem("rol");
    const params = new URLSearchParams();

    let count = 0;

    const statusFilter = filters.status;

    if (statusFilter === "evaluated") {
        params.append("has_evaluation", "true");
        count++;
    } else if (statusFilter === "pending") {
        params.append("has_evaluation", "false");
        count++;
    } else if (statusFilter && statusFilter !== "") {
        params.append("status", statusFilter);
        count++;
    }

    if (filters.language) { params.append("language_name", filters.language); count++; }
    if (filters.minScore) { params.append("min_score", filters.minScore); count++; }
    if (filters.maxScore) { params.append("max_score", filters.maxScore); count++; }
    if (filters.dateFrom) { params.append("date_from", filters.dateFrom); count++; }
    if (filters.dateTo) { params.append("date_to", filters.dateTo); count++; }
    if (filters.studentName) { params.append("student_name", filters.studentName); count++; }
    if (filters.subjectId) { params.append("subject_id", filters.subjectId); count++; }
    if (filters.passed === "true") { params.append("passed", "true"); count++; }
    if (filters.passed === "false") { params.append("passed", "false"); count++; }

    if (currentSearchTerm && currentSearchTerm.trim() !== "") {
        if (currentSearchType === "student") params.append("student_name", currentSearchTerm);
        else if (currentSearchType === "exercise") params.append("exercise_title", currentSearchTerm);
        else if (currentSearchType === "subject") params.append("subject_name", currentSearchTerm);
        count++;
    }

    lastFiltersCount = count;


    const PAGE_LIMIT = 200; // máximo permitido por el backend
    let allItems = [];
    let currentOffset = 0;
    let hasMore = true;
    let totalCount = 0;

    // Clonamos los parámetros base para reutilizarlos
    const baseParams = new URLSearchParams(params.toString());
    baseParams.set("limit", PAGE_LIMIT);

    while (hasMore) {
        baseParams.set("offset", currentOffset);
        
        const pageData = await searchSubmissions(baseParams);
        const pageItems = pageData.items || [];
        
        allItems = allItems.concat(pageItems);
        totalCount = pageData.total || 0;
        hasMore = pageData.has_more || false;
        
        currentOffset += PAGE_LIMIT;

        // Seguridad: evitar bucles infinitos (máximo 1000 items)
        if (allItems.length >= 1000) {
            console.warn("⚠️ Se alcanzó el límite de 1000 items. Puede haber más resultados.");
            break;
        }
    }

    let items = allItems;


    // Filtro extra por lenguaje (frontend)
    if (filters.language && filters.language !== "") {
        items = items.filter(item => item.language_name === filters.language);
    }

    // Filtro local de búsqueda por prefijo (startsWith)
    if (currentSearchTerm && currentSearchTerm.trim() !== "") {
        const searchWords = currentSearchTerm.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0);
        items = items.filter(item => {
            let value = "";
            if (currentSearchType === "student") {
                value = (item.student_name || "").toLowerCase();
            } else if (currentSearchType === "exercise") {
                value = (item.exercise_title || "").toLowerCase();
            } else if (currentSearchType === "subject") {
                value = (item.subject_name || "").toLowerCase();
            }
            const fieldWords = value.split(/\s+/);
            return searchWords.every(searchWord =>
                fieldWords.some(fieldWord => fieldWord.startsWith(searchWord))
            );
        });
    }

    // Para admin, enriquecer con academic_year
    if (rol === "admin" && allSubmissionsData.length > 0) {
        const yearMap = new Map();
        allSubmissionsData.forEach(sub => {
            yearMap.set(sub.id, sub.academic_year || "Unknown");
        });
        items = items.map(item => ({
            ...item,
            academic_year: yearMap.get(item.id) || "Unknown"
        }));
    }

    if (keepView && document.querySelector(".filtered-submissions-container")) {
        updateSubmissionsTableBody(items, rol);
        const filterBadge = document.querySelector(".filter-badge");
        if (filterBadge) filterBadge.textContent = count;
        return;
    }

    renderFilteredSubmissions(items, rol, count, currentFilters, currentSearchTerm, currentSearchType);
}
let allSubmissionsData = [];     
let allSubmissionsExercises = []; 
let allSubmissionsSubjects = [];   
let allSubmissionsEvaluations = [];
let allSubmissionsUsers = [];

/* SEARCH SUBMISSIONS  */
export async function searchSubmissionsController(searchTerm, searchType = null) {
    if (searchType !== null) currentSearchType = searchType;
    currentSearchTerm = searchTerm;
    const rol = localStorage.getItem("rol");
    
    // Si hay filtros activos, usamos applySubmissionFiltersController (ya tiene el filtro local)
    if (lastFiltersCount > 0) {
        await applySubmissionFiltersController(true);
        return;
    }
    if (rol === "student" && currentSearchType === "student") {
    currentSearchType = "exercise";
    }
    // ========== SIN FILTROS ACTIVOS ==========
    if (rol === "admin") {
        // ... (código existente para admin, que ya usa el filtro local)
        if (!allSubmissionsData.length) await loadSubmissions();
        let filtered = [];
        const trimmed = searchTerm?.trim() || "";
        if (trimmed === "") {
            filtered = allSubmissionsData;
        } else {
            const searchWords = trimmed.toLowerCase().split(/\s+/);
            filtered = allSubmissionsData.filter(item => {
                let value = "";
                if (currentSearchType === "student") value = (item.student_name || "").toLowerCase();
                else if (currentSearchType === "exercise") value = (item.exercise_title || "").toLowerCase();
                else if (currentSearchType === "subject") value = (item.subject_name || "").toLowerCase();
                const fieldWords = value.split(/\s+/);
                return searchWords.every(searchWord =>
                    fieldWords.some(fieldWord => fieldWord.startsWith(searchWord))
                );
            });
        }
        updateSubmissionsTableBody(filtered, rol);
    } 
    else {
        // ========== PROFESOR / ESTUDIANTE ==========
        if (!searchTerm || searchTerm.trim() === "") {
            // Si no hay término, recargar todas las submissions (sin filtro)
            loadSubmissions();
            return;
        }

        // 1. Llamar al backend con el término (búsqueda aproximada)
        const params = new URLSearchParams();
        if (currentSearchType === "student") params.append("student_name", searchTerm);
        else if (currentSearchType === "exercise") params.append("exercise_title", searchTerm);
        else if (currentSearchType === "subject") params.append("subject_name", searchTerm);
        
        const data = await searchSubmissions(params);
        let items = data.items || [];

        // 2. Aplicar el mismo filtro local de "startsWith" por palabras
        const searchWords = searchTerm.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0);
        items = items.filter(item => {
            let value = "";
            if (currentSearchType === "student") {
                value = (item.student_name || "").toLowerCase();
            } else if (currentSearchType === "exercise") {
                value = (item.exercise_title || "").toLowerCase();
            } else if (currentSearchType === "subject") {
                value = (item.subject_name || "").toLowerCase();
            }
            const fieldWords = value.split(/\s+/);
            return searchWords.every(searchWord =>
                fieldWords.some(fieldWord => fieldWord.startsWith(searchWord))
            );
        });

        // 3. Actualizar la tabla
        updateSubmissionsTableBody(items, rol);
    }
}
export function changeSearchTypeController(newType) {
    currentSearchType = newType;
    if (currentSearchTerm && currentSearchTerm.trim() !== "") {
        searchSubmissionsController(currentSearchTerm, newType);
    }
}

/* Exportar submissions filtradas a CSV */
export async function exportSubmissionsController() {
    try {
        const filters = getFilterValues();
        const params = {};
        
        if (filters.status) params.status = filters.status;
        if (filters.language) params.language_name = filters.language;
        if (filters.minScore) params.min_score = filters.minScore;
        if (filters.maxScore) params.max_score = filters.maxScore;
        if (filters.dateFrom) params.date_from = filters.dateFrom;
        if (filters.dateTo) params.date_to = filters.dateTo;
        if (filters.studentName) params.student_name = filters.studentName;
        if (filters.subjectId) params.subject_id = filters.subjectId;
        if (filters.passed === "true") params.passed = true;
        if (filters.passed === "false") params.passed = false;
        
        const blob = await exportSubmissionsCSV(params);
        
        // Crear y descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `submissions_export_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        showNotificationController("Export completed successfully!", "success");
    } catch (error) {
        console.error("Error exporting submissions:", error);
        showNotificationController("Error exporting data", "error");
    }
}
/* LIMPIAR FILTROS - SOLO LIMPIA LOS INPUTS DEL FORMULARIO */
export function clearFiltersController() {
    // Limpiar los inputs del DOM
    const statusSelect = document.getElementById("filterStatus");
    const languageSelect = document.getElementById("filterLanguage");
    const studentNameInput = document.getElementById("filterStudentName");
    const subjectSelect = document.getElementById("filterSubject");
    const minScoreInput = document.getElementById("filterMinScore");
    const maxScoreInput = document.getElementById("filterMaxScore");
    const passedSelect = document.getElementById("filterPassed");
    const dateFromInput = document.getElementById("filterDateFrom");
    const dateToInput = document.getElementById("filterDateTo");
    
    if (statusSelect) statusSelect.value = "";
    if (languageSelect) languageSelect.value = "";
    if (studentNameInput) studentNameInput.value = "";
    if (subjectSelect) subjectSelect.value = "";
    if (minScoreInput) minScoreInput.value = "";
    if (maxScoreInput) maxScoreInput.value = "";
    if (passedSelect) passedSelect.value = "";
    if (dateFromInput) dateFromInput.value = "";
    if (dateToInput) dateToInput.value = "";
    
    // Limpiar también los filtros actuales en memoria
    currentFilters = {};
    lastFiltersCount = 0;
    
    showNotificationController("Filters cleared", "info");
}
/* COURSE MESSAGES */
export async function loadCourseMessagesController(offeringId) {
    try {
        const rol = localStorage.getItem("rol");
        const offeringIdNum = parseInt(offeringId);
        
        // Obtener el nombre de la asignatura
        let subjectName = "";
        let subjectId = null;
        
        if (rol === "student") {
            // Para estudiante: buscar en sus matrículas
            const enrollments = await getMyEnrollments();
            for (const enrollment of enrollments) {
                for (const course of enrollment.courses || []) {
                    if (Number(course.offering_id) === offeringIdNum) {
                        subjectName = course.course_name;
                        subjectId = course.course_id;
                        break;
                    }
                }
                if (subjectName) break;
            }
            
            if (!subjectName) {
                try {
                    const allOfferings = await getAllCourseOfferings();
                    const offering = allOfferings.find(o => o.id === offeringIdNum);
                    if (offering && offering.subject) {
                        subjectName = offering.subject.name;
                        subjectId = offering.subject_id;
                    }
                } catch (err) {}
            }
            
            if (!subjectId) {
                console.error("No se encontró la asignatura para el offering:", offeringId);
                renderCourseMessages(offeringId, [], [], null, rol, "");
                return;
            }
            
            const teachers = await getAvailableTeachers();
            const subjectTeachers = [];
            
            for (const teacher of teachers) {
                try {
                    const offerings = await getCourseOfferingsByTeacher(teacher.id);
                    const teachesSubject = offerings.some(
                        offering => Number(offering.subject_id) === Number(subjectId)
                    );
                    if (teachesSubject) {
                        subjectTeachers.push(teacher);
                    }
                } catch(error) {
                    console.error(`Error loading offerings for teacher ${teacher.id}`, error);
                }
            }

            const conversations = await getConversations();
            const notifications = await getUnreadNotifications();

            renderCourseMessages(
                offeringId,
                subjectTeachers,
                conversations,
                notifications,
                rol,
                subjectName  // <- PASAR EL NOMBRE
            );
        } 
        else if (rol === "teacher") {
            // Para profesor: obtener estudiantes y el nombre de la asignatura
            const offerings = await getCourseOfferingsByTeacher();
            const offering = offerings.find(o => Number(o.offering_id) === offeringIdNum);
            if (offering) {
                subjectName = offering.subject_name;
                subjectId = offering.subject_id;
            }
            
            const students = await getStudentsByCourseOfferingEnrollments(offeringIdNum);
            
            const conversations = await getConversations();
            const notifications = await getUnreadNotifications();
            
            renderCourseMessages(
                offeringId,
                students.students || [],
                conversations,
                notifications,
                rol,
                subjectName  // <- PASAR EL NOMBRE
            );
        }
    } catch(error) {
        console.error("Error loading course messages:", error);
        renderCourseMessages(offeringId, [], [], null, rol, "");
    }
}
/* CHAT CONTROLLER - Genérico para profesor o estudiante */
export async function loadChatController(userId, userName)
{
    try
    {
        currentChatUserId = userId;
        currentChatUserName = userName;
        
        const [
            messages,
            presence,
            myProfile
        ] = await Promise.all([
            getMessages(userId),
            getPresence(),
            getMyProfile()
        ]);

        const userPresence = presence.find(
            user => Number(user.user_id) === Number(userId)
        );

        const currentUserId = Number(myProfile.id);
        
        renderChatView(
            userId,
            userName,
            messages,
            userPresence,
            currentUserId
        );
    }
    catch(error)
    {
        console.error("Error loading chat:", error);
    }
}

/* UPLOAD CHAT FILE - Para archivo único */
export async function uploadChatFileController(file, receiverId)
{
    try
    {
        await uploadChatFile(file, receiverId);

        // Recargar el chat para mostrar el mensaje con el archivo
        if (currentChatUserId) {
            await loadChatController(currentChatUserId, currentChatUserName);
        }
    }
    catch(error)
    {
        console.error("Error uploading file:", error);
        alert("Error al subir el archivo: " + error.message);
    }
}


/* UPLOAD MULTIPLE CHAT FILES - Para múltiples archivos (nueva función) */
export async function uploadMultipleChatFilesController(files, receiverId)
{
    try
    {
        if (!files || files.length === 0) return;
        
        if (files.length > 5) {
            alert("Máximo 5 archivos por mensaje");
            return;
        }
        
        await uploadMultipleChatFiles(files, receiverId);

        // Recargar el chat para mostrar el mensaje con los archivos
        if (currentChatUserId) {
            await loadChatController(currentChatUserId, currentChatUserName);
        }
    }
    catch(error)
    {
        console.error("Error uploading files:", error);
        alert("Error al subir los archivos: " + error.message);
    }
}

/*Inicializar conexión WebSocket (llamada desde main.js)*/
export async function initChatConnectionController() {
    if (isChatInitialized) {
        console.log("Chat already initialized");
        return;
    }
    
    try {
        await connectChatWebSocket();
        isChatInitialized = true;
        
        // Escuchar mensajes entrantes
        onWebSocketMessage(handleIncomingMessage);
        
        console.log("Chat connection initialized");
    } catch (error) {
        console.error("Error initializing chat:", error);
    }
}

/* Manejar mensajes entrantes por WebSocket */
function handleIncomingMessage(message) {
    console.log("Mensaje recibido:", message);
    
    // Si es un mensaje nuevo
    if (message.type === "message" || message.type === "notification") {
        updateNotificationsBadge();
        const dropdown = document.getElementById("notificationsDropdown");
        if (dropdown && !dropdown.classList.contains("hidden")) {
            loadAndRenderNotifications();
        }
        
        if (Notification.permission === "granted" && document.hidden) {
            const title = message.title || "New message";
            const body = message.body || `${message.sender_name || "Someone"}: ${message.message_preview || "New message"}`;
            new Notification(title, { body, icon: "/src/img/notificacion.png" });
        }
    }
    
    // NUEVO: Si un mensaje fue eliminado
    if (message.type === "message_deleted") {
        console.log("Message deleted, refreshing notifications");
        updateNotificationsBadge();
        
        // Si el dropdown está abierto, recargar
        const dropdown = document.getElementById("notificationsDropdown");
        if (dropdown && !dropdown.classList.contains("hidden")) {
            loadAndRenderNotifications();
        }
        
        // Si estamos en el chat, recargar los mensajes
        if (currentChatUserId) {
            loadChatController(currentChatUserId, currentChatUserName);
        }
    }
    
    // Si es un mensaje de chat y estamos en el chat con ese usuario
    if (message.type === "message" && currentChatUserId) {
        if (message.sender_id === currentChatUserId || message.receiver_id === currentChatUserId) {
            loadChatController(currentChatUserId, currentChatUserName);
        }
    }
}
/*Enviar mensaje de texto */
export async function sendChatMessageController(receiverId, message) {
    if (!message || !message.trim()) {
        console.warn("Mensaje vacío");
        return false;
    }
    
    try {
        await sendChatMessage(receiverId, message.trim());
        
        // Recargar el chat después de enviar
        if (currentChatUserId) {
            await loadChatController(currentChatUserId, currentChatUserName);
        }
        
        return true;
    } catch (error) {
        console.error("Error sending message:", error);
        return false;
    }
}
/* Limpiar conexión al salir*/
export function cleanupChatController() {
    isChatInitialized = false;
    currentChatUserId = null;
    currentChatUserName = null;
    disconnectChatWebSocket();
}

/* Descargar archivo adjunto del chat */
export async function downloadChatAttachmentController(attachmentId, filename) {
    try {
        const blob = await downloadChatAttachment(attachmentId);
        
        // Crear URL para descargar
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error("Error downloading file:", error);
        alert("Error al descargar el archivo: " + error.message);
        return false;
    }
}

/* Eliminar un mensaje del chat */
export async function deleteChatMessageController(messageId) {
    try {
        await deleteChatMessage(messageId);
        
        // Recargar el chat actual
        if (currentChatUserId) {
            await loadChatController(currentChatUserId, currentChatUserName);
        }
        
        // Actualizar el badge de notificaciones (por si el mensaje eliminado era no leído)
        await updateNotificationsBadge();
        
        return true;
    } catch (error) {
        console.error("Error deleting message:", error);
        alert("Error al eliminar el mensaje: " + error.message);
        return false;
    }
}


/*Eliminar un archivo adjunto */
export async function deleteChatAttachmentController(attachmentId) {
    try {
        await deleteChatAttachment(attachmentId);
        
        // Recargar el chat actual para reflejar que el mensaje puede haber desaparecido
        if (currentChatUserId) {
            await loadChatController(currentChatUserId, currentChatUserName);
        }
        
        return true;
    } catch (error) {
        console.error("Error deleting attachment:", error);
        alert("Error al eliminar el archivo: " + error.message);
        return false;
    }
}

/*Marcar conversación como leída*/
export async function markConversationReadController(senderId) {
    try {
        await markConversationAsRead(senderId);
        
        // Actualizar contadores
        if (currentChatUserId === senderId) {
            await loadChatController(currentChatUserId, currentChatUserName);
        }
        
        return true;
    } catch (error) {
        console.error("Error marking as read:", error);
        return false;
    }
}

/* Marcar todas las notificaciones como leídas */
export async function markAllNotificationsReadController() {
    try {
        // Marcar conversación por conversación (como alternativa)
        const data = await getNotificationsController();
        const uniqueSenders = new Set();
        
        // Obtener remitentes únicos
        for (const notif of data.notifications) {
            if (notif.sender_id && !uniqueSenders.has(notif.sender_id)) {
                uniqueSenders.add(notif.sender_id);
            }
        }
        
        // Marcar cada conversación como leída
        for (const senderId of uniqueSenders) {
            try {
                await markConversationAsRead(senderId);
            } catch (err) {
                console.log(`Error marking conversation with ${senderId}:`, err);
            }
        }
        
        await updateNotificationsBadge();
        
        // Recargar el dropdown si está abierto
        const dropdown = document.getElementById("notificationsDropdown");
        if (dropdown && !dropdown.classList.contains("hidden")) {
            await loadAndRenderNotifications();
        }
        
        return true;
    } catch (error) {
        console.error("Error marking all as read:", error);
        return false;
    }
}

/* ==========================================
   RANKING CONTROLLERS
========================================== */
export async function loadSubjectRanking(subjectId, subjectName) {
    try {
        const rol = localStorage.getItem("rol");
        
        // Obtener ranking completo con estadísticas
        const rankingData = await getSubjectRanking(subjectId, 100, 0);
        
        console.log("Ranking data recibido:", rankingData);
        
        let myRanking = null;
        
        if (rol === "student") {
            try {
                myRanking = await getMySubjectRanking(subjectId);
                console.log("My ranking:", myRanking);
            } catch (error) {
                console.log("No se pudo obtener ranking personal:", error);
                myRanking = null;
            }
        }
        
        // Asegurar que los datos tengan la estructura correcta
        const enhancedRankingData = {
            ...rankingData,
            subject_id: subjectId,
            subject_name: subjectName,
            total_exercises: rankingData.total_exercises || 0,
            total_students: rankingData.total_students || rankingData.ranking?.length || 0
        };
        
        renderRankingView(enhancedRankingData, myRanking, subjectName, rol);
    } catch (error) {
        console.error("Error loading ranking:", error);
    }
}

/* ==========================================
   MY PROFILE - CONTROLLER
========================================== */
export async function loadMyProfile() {
    try {
        console.log("loadMyProfile called");
        const user = await getMyProfile();
        const rol = user.role || localStorage.getItem("rol");
        let stat1 = 0;      // primer número (ejercicios, cursos, usuarios)
        let stat2 = 0;      // segundo número (score, estudiantes, submissions)
        let classRank = null;

        if (rol === "student") 
        {
            const submissions = await getMySubmissions();

            // 1. Calcular la MEJOR nota por ejercicio
            const bestScores = new Map();
            for (const sub of submissions) {
                const evaluation = await getEvaluationBySubmission(sub.id);
                if (!evaluation || evaluation.score === undefined) continue;
                const exerciseId = sub.exercise_id;
                if (!bestScores.has(exerciseId) || evaluation.score > bestScores.get(exerciseId)) {
                    bestScores.set(exerciseId, evaluation.score);
                }
            }

            // stat1 = número de EJERCICIOS ÚNICOS con al menos una entrega
            stat1 = bestScores.size;

            // stat2 = promedio de las MEJORES notas
            if (bestScores.size > 0) {
                const total = Array.from(bestScores.values()).reduce((a, b) => a + b, 0);
                stat2 = Math.round(total / bestScores.size);
            } else {
                stat2 = 0;
            }

            // 2. ClassRank (igual que antes)
            const enrollments = await getMyEnrollments();
            if (enrollments && enrollments.length > 0) {
                let firstSubjectId = null;
                for (const enrollment of enrollments) {
                    if (enrollment.courses && enrollment.courses.length > 0) {
                        firstSubjectId = enrollment.courses[0].course_id;
                        break;
                    }
                }
                if (firstSubjectId) {
                    try {
                        const ranking = await getMySubjectRanking(firstSubjectId);
                        classRank = ranking?.rank || null;
                    } catch (e) {
                        console.log("Ranking not available");
                    }
                }
            }
        }
        else if (rol === "teacher") {
            // Obtener las ofertas del profesor
            const offerings = await getCourseOfferingsByTeacher();
            stat1 = offerings.length; // Courses Teaching
            
            // Obtener estudiantes únicos de todas sus ofertas
            const uniqueStudents = new Set();
            for (const offering of offerings) {
                const students = await getStudentsByCourseOffering(offering.offering_id);
                for (const student of students) {
                    uniqueStudents.add(student.id);
                }
            }
            stat2 = uniqueStudents.size; // Students Taught
            // No hay classRank para teacher
        } 
        else if (rol === "admin") {
            const totalUsers = await getCountAllUsers();
            stat1 = totalUsers; // Total Users
            stat2 = await getTotalSubmissionsCount();
        }
        
        const stats = { 
            stat1: stat1, 
            stat2: stat2, 
            classRank: classRank,
            role: rol 
        };
        renderMyProfile(user, stats);
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

/* Guardar cambios del perfil */
export async function saveProfileChanges(name) {
    try {
        if (!name || name.trim() === "") {
            throw new Error("El nombre no puede estar vacío");
        }
        
        const currentUser = await getMyProfile();
        const userId = currentUser.id;
        
        const updatedUser = await updateMyProfile(userId, { name: name.trim() });
        
        const currentRol = localStorage.getItem("rol");

        await loadMyProfile();
        
        const userDiv = document.querySelector(".user");
        if (userDiv) {
            const userNameSpan = userDiv.querySelector("span");
            if (userNameSpan && updatedUser.name) {
                userNameSpan.textContent = updatedUser.name;
            }
            const avatar = userDiv.querySelector(".avatar");
            if (avatar && updatedUser.name) {
                avatar.textContent = updatedUser.name.charAt(0).toUpperCase();
            }
        }
        
        return { success: true, user: updatedUser };
    } catch (error) {
        console.error("Error saving profile:", error);
        return { success: false, error: error.message };
    }
}

/* ==========================================
   EDIT EXERCISE 
========================================== */

/* Cargar formulario de edición de ejercicio */
export async function loadEditExercise(exerciseId, subjectId = null,source = "exercises") {
    try {
        console.log("Loading edit exercise:", exerciseId);
        
        const exercise = await getExerciseById(exerciseId);
        const testCases = await getTestCaseByExercise(exerciseId);
        const allLanguages = await getAllProgrammingLanguages();
        const assignedLanguages = await getLanguagesByExercise(exerciseId);
        const assignedLanguageIds = new Set(assignedLanguages.map(l => l.language_id));
        const solution = exercise.solution || "";
        
        renderEditExercise(exercise, testCases, allLanguages, assignedLanguageIds, solution, subjectId,source);
        
        // Cargar argumentos después de renderizar 
        setTimeout(async () => {
            const argumentsData = await getArgumentsByExercise(exerciseId);
            console.log("ARGUMENTS DATA RECEIVED:", argumentsData);
            if (argumentsData && argumentsData.length > 0) {
                renderEditExerciseArguments(argumentsData);
            }
            
            await loadRubricToEditFormController(exerciseId);
        }, 100);
        
    } catch (error) {
        console.error("Error loading edit exercise:", error);
    }
}

/* Controlador para cargar rúbrica al formulario de edición */
export async function loadRubricToEditFormController(exerciseId) {
    try {
        const rubric = await getRubricByExercise(exerciseId);
        if (rubric && rubric.criteria && Object.keys(rubric.criteria).length > 0) {
            // Tiene rúbrica - mostrar la real
            renderRubricSection('rubricContainer', rubric);
        } else {
            // No tiene rúbrica - mostrar vacía (sin ejemplos)
            renderEmptyRubricSection('rubricContainer', false);
        }
    } catch (error) {
        console.error("Error loading rubric to form:", error);
        renderEmptyRubricSection('rubricContainer', false);
    }
}

/* Mover argumento hacia arriba */
export function moveArgumentUpController(argumentItem) {
    moveArgumentUp(argumentItem);
}

/* Mover argumento hacia abajo */
export function moveArgumentDownController(argumentItem) {
    moveArgumentDown(argumentItem);
}

export async function loadEditExerciseArguments(exerciseId) {
    try {
        const argumentsData = await getArgumentsByExercise(exerciseId);
        if (argumentsData && argumentsData.length > 0) {
            renderEditExerciseArguments(argumentsData);
        } else {
            const argumentsList = document.getElementById("editArgumentsList");
            if (argumentsList) {
                argumentsList.innerHTML = `
                    <div class="empty-arguments">
                        <p>No arguments defined yet.</p>
                        <p class="hint">Click "Add Argument" to define function parameters.</p>
                    </div>
                `;
                updateEditFormArgumentsCount();
            }
        }
    } catch (error) {
        console.error("Error loading arguments:", error);
    }
}

/* Añadir argumento al formulario de edición */
export function addEditArgumentToFormController() {
    addEditArgumentToForm();
}

/* Obtener argumentos del formulario de edición */
export function getEditFormArguments() {
    // Esta función debe llamar a la función de view.js
    return getEditFormArgumentsFromView();
}


/* Eliminar argumento del formulario de edición */
export function deleteEditArgumentController(argumentItem) {
    deleteEditArgumentFromForm(argumentItem);
}

export async function saveExerciseArguments(exerciseId, argumentsData) {
    try {
        // Si no hay argumentos en la UI (o es array vacío), eliminar todos los argumentos del backend
        if (!argumentsData || argumentsData.length === 0) {
            await deleteAllArgumentsByExercise(exerciseId);
            return { success: true };
        }
        
        // 1. Eliminar argumentos marcados para borrar (delete: true)
        const toDelete = argumentsData.filter(arg => arg.delete === true);
        for (const arg of toDelete) {
            if (arg.id) {
                try {
                    await deleteArgument(arg.id);
                    console.log(`Deleted argument ${arg.id}`);
                } catch (err) {
                    console.error(`Error deleting argument ${arg.id}:`, err);
                }
            }
        }
        
        // 2. Obtener argumentos actuales para detectar cambios de posición
        const currentArguments = await getArgumentsByExercise(exerciseId);
        const currentPositionMap = new Map();
        for (const currArg of currentArguments) {
            currentPositionMap.set(currArg.id, currArg.position);
        }
        
        // 3. Detectar swaps de posición
        const swaps = [];
        for (const arg of argumentsData) {
            if (arg.id && !arg.delete && !arg.is_new) {
                const currentPosition = currentPositionMap.get(arg.id);
                if (currentPosition !== undefined && currentPosition !== arg.position) {
                    swaps.push({ argument_id: arg.id, new_position: arg.position });
                }
            }
        }
        if (swaps.length > 0) {
            await swapArgumentPositions(swaps);
        }
        
        // 4. Crear nuevos argumentos (los que no tienen ID)
        const toCreate = argumentsData.filter(arg => (!arg.id || arg.is_new) && !arg.delete);
        if (toCreate.length === 1) {
            const arg = toCreate[0];
            await createArgument(exerciseId, arg.name, arg.type_name, arg.position);
        } else if (toCreate.length > 1) {
            try {
                await createArgumentsBulk(exerciseId, toCreate);
            } catch (err) {
                for (const arg of toCreate) {
                    await createArgument(exerciseId, arg.name, arg.type_name, arg.position);
                }
            }
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error saving arguments:", error);
        return { success: false, error: error.message };
    }
}
/* Guardar cambios del ejercicio (solo datos básicos del formulario) */
export async function saveExerciseChanges(exerciseId, formData) {
    try {
        const updateData = {};
        
        if (formData.title !== undefined && formData.title.trim() !== "") updateData.title = formData.title;
        if (formData.description !== undefined && formData.description.trim() !== "") updateData.description = formData.description;
       if (formData.deadline !== undefined && formData.deadline !== null && formData.deadline !== "") {
            const localDate = new Date(formData.deadline);
            if (!isNaN(localDate.getTime())) {
                updateData.deadline = localDate.toISOString().slice(0, 19).replace('T', ' ') + 'Z';
            }
        }
        if (formData.evaluation_mode !== undefined) updateData.evaluation_mode = formData.evaluation_mode;
        if (formData.return_type !== undefined) updateData.return_type = formData.return_type;  
        if (formData.solution !== undefined) updateData.solution = formData.solution;
        if (formData.visibility !== undefined) updateData.visibility = formData.visibility;
        
        console.log("Sending update data:", updateData);
        
        if (Object.keys(updateData).length === 0) {
            return { success: false, error: "No data to update" };
        }
        
        const updatedExercise = await updateExercise(exerciseId, updateData);
        return { success: true, exercise: updatedExercise };
        
    } catch (error) {
        console.error("Error saving exercise:", error);
        return { success: false, error: error.message };
    }
}

/* Guardar test case  */
export async function saveTestCase(exerciseId, testCaseData) {
    try {
        let result;
        // IMPORTANTE: El backend usa is_hidden (true = oculto, false = visible)
        const isHidden = !testCaseData.is_visible;
        
        // Si tiene ID y no es temporal, actualizar
        if (testCaseData.id && !testCaseData.id.toString().startsWith("new_")) {
            result = await updateTestCase(
                testCaseData.id, 
                testCaseData.input_data, 
                testCaseData.expected_output,
                isHidden
            );
        } else {
            // Crear nuevo test case
            result = await createTestCase(
                exerciseId, 
                testCaseData.input_data, 
                testCaseData.expected_output,
                !isHidden
            );
        }
        return { success: true, testCase: result };
        
    } catch (error) {
        console.error("Error saving test case:", error);
        return { success: false, error: error.message };
    }
}

/* Guardar ejercicio (incluyendo rúbrica) */
export async function handleSaveExerciseWithArguments(exerciseId, formData, argumentsData, rubricData) {
    try {
        console.log("=== handleSaveExerciseWithArguments ===");
        
        // 1. GUARDAR DATOS BÁSICOS DEL EJERCICIO
        const exerciseResult = await saveExerciseChanges(exerciseId, formData);
        if (!exerciseResult.success) {
            return exerciseResult;
        }
        
        // ========== 2. SINCRONIZAR TEST CASES (elimina los que faltan) ==========
        const testCaseItems = document.querySelectorAll("#testCasesList .test-case-item");
        await syncTestCases(exerciseId, testCaseItems);
        
        // ========== 3. GUARDAR LENGUAJES DE PROGRAMACIÓN ==========
        const languageChips = document.querySelectorAll("#languagesGrid .language-chip");
        const selectedLanguages = [];
        for (const chip of languageChips) {
            if (chip.classList.contains("active")) {
                selectedLanguages.push(parseInt(chip.dataset.langId));
            }
        }
        // Obtener lenguajes actuales del ejercicio
        const currentLanguages = await getLanguagesByExercise(exerciseId);
        const currentLangIds = currentLanguages.map(l => l.language_id);
        // Añadir nuevos lenguajes
        for (const langId of selectedLanguages) {
            if (!currentLangIds.includes(langId)) {
                await assignLanguageToExercise(exerciseId, langId);
            }
        }
        // Eliminar lenguajes deseleccionados
        for (const langId of currentLangIds) {
            if (!selectedLanguages.includes(langId)) {
                await removeLanguageFromExercise(exerciseId, langId);
            }
        }
        
        // ========== 4. GUARDAR ARGUMENTOS ==========
        if (formData.evaluation_mode === "function_calls") {
            // Obtener todos los argument-items del DOM (incluyendo los ocultos por data-deleted)
            const argumentItems = document.querySelectorAll("#editArgumentsList .argument-item");
            await syncExerciseArguments(exerciseId, argumentItems);
        } else {
            await deleteAllArgumentsByExercise(exerciseId);
        }
        
        // ========== 5. GUARDAR RÚBRICA ==========
        const hasCriteria = rubricData && rubricData.criteria && rubricData.criteria.length > 0;
        if (hasCriteria) {
            try {
                const existingRubric = await getRubricByExercise(exerciseId);
                // Convertir criterios a objeto
                const criteriaObj = {};
                rubricData.criteria.forEach(c => {
                    if (c.name && c.name.trim()) {
                        criteriaObj[c.name.trim()] = c.description || "";
                    }
                });
                if (existingRubric && existingRubric.id) {
                    await updateRubric(existingRubric.id, { criteria: criteriaObj, total_score: rubricData.total_score || 100 });
                } else {
                    await createRubric(exerciseId, criteriaObj);
                }
            } catch (error) {
                console.error("Error saving rubric:", error);
            }
        } else {
            // Si no hay criterios, eliminar rúbrica existente
            try {
                const existingRubric = await getRubricByExercise(exerciseId);
                if (existingRubric && existingRubric.id) {
                    await deleteRubric(existingRubric.id);
                }
            } catch (err) {
                console.log("Error deleting rubric:", err);
            }
        }
        
        return { success: true, exercise: exerciseResult.exercise };
    } catch (error) {
        console.error("Error saving exercise with arguments:", error);
        return { success: false, error: error.message };
    }
}

/* Cancelar edición */
export function handleCancelEdit() {
    // Buscar el botón de retroceso específico dentro de la página de edición
    const backBtn = document.querySelector(".edit-exercise-page .back-btn");
    if (backBtn) {
        backBtn.click(); // Simula clic en el botón de retroceso
    } else {
        // Si no está, redirigir a ejercicios como fallback
        loadExercises();
        setActiveMenu(2);
    }
}
/* Añadir test case (guarda inmediatamente) */
export async function handleAddTestCase(exerciseId) {
    const newTestCase = {
        input_data: "",
        expected_output: "",
        name: `Test case ${document.querySelectorAll(".test-case-item").length + 1}`,
        is_visible: true
    };
    return await saveTestCase(exerciseId, newTestCase);
}

/* Eliminar test case (guarda inmediatamente) */
export async function handleDeleteTestCase(testCaseId, exerciseId) {
    try {
        await deleteTestCase(testCaseId);
        await loadEditExercise(exerciseId);
        return { success: true };
    } catch (error) {
        console.error("Error deleting test case:", error);
        return { success: false, error: error.message };
    }
}

/* Actualizar test case */
export async function handleUpdateTestCase(exerciseId, testId, inputValue, outputValue, isVisible) {
    try {
        
        const isHidden = !isVisible;
        
        if (testId && testId.toString().startsWith("new_")) {
            // Crear nuevo test case
            const result = await createTestCase(exerciseId, inputValue, outputValue, isHidden);
            return { success: true, testCase: result };
        } else {
            // Actualizar test case existente
            const result = await updateTestCase(testId, inputValue, outputValue, isHidden);
            return { success: true, testCase: result };
        }
    } catch (error) {
        console.error("Error updating test case:", error);
        return { success: false, error: error.message };
    }
}

/* Toggle lenguaje (guarda inmediatamente) */
export async function handleToggleLanguage(exerciseId, languageId, isActive) {
    try {
        if (isActive) {
            await removeLanguageFromExercise(exerciseId, languageId);
        } else {
            await assignLanguageToExercise(exerciseId, languageId);
        }
        return { success: true };
    } catch (error) {
        console.error("Error toggling language:", error);
        return { success: false, error: error.message };
    }
}

export function showNotificationController(message, type = "info") {
    showNotification(message, type);
}

export function showSaveIndicatorController(card) {
    showSaveIndicator(card);
}

export async function syncTestCases(exerciseId, currentTestItems) {
    // Obtener test cases actuales del backend
    const existingTestCases = await getTestCaseByExercise(exerciseId);
    const existingIds = existingTestCases.map(tc => tc.id);
    
    // IDs de test cases que están en el DOM (excluyendo nuevos temporales)
    const domIds = [];
    for (const item of currentTestItems) {
        const testId = item.dataset.testId;
        if (testId && !testId.toString().startsWith("new_")) {
            domIds.push(parseInt(testId));
        }
    }
    
    // IDs a eliminar (existen en backend pero no en DOM)
    const toDeleteIds = existingIds.filter(id => !domIds.includes(id));
    
    // Eliminar test cases que ya no están en el DOM
    for (const id of toDeleteIds) {
        try {
            await deleteTestCase(id);
            console.log(`Deleted test case ${id}`);
        } catch (err) {
            console.error(`Error deleting test case ${id}:`, err);
        }
    }
    
    // Actualizar o crear los test cases que están en DOM
    for (const item of currentTestItems) {
        const testId = item.dataset.testId;
        const inputValue = item.querySelector(".test-input-large")?.value || "";
        const outputValue = item.querySelector(".test-output-large")?.value || "";
        const visibleCheck = item.querySelector(".test-visibility");
        const isVisibleTest = visibleCheck ? visibleCheck.checked : true;
        const isHidden = !isVisibleTest;
        
        if (testId && !testId.toString().startsWith("new_")) {
            // Actualizar existente
            await updateTestCase(testId, inputValue, outputValue, isHidden);
        } else {
            // Crear nuevo test case
            await createTestCase(exerciseId, inputValue, outputValue, isHidden);
        }
    }
}

export async function syncExerciseArguments(exerciseId, currentArgumentItems) {
    // Obtener argumentos actuales del backend
    const existingArguments = await getArgumentsByExercise(exerciseId);
    const existingIds = existingArguments.map(arg => arg.id);
    
    // IDs de argumentos que están en el DOM (excluyendo nuevos temporales)
    const domIds = [];
    for (const item of currentArgumentItems) {
        const argId = item.dataset.argumentId;
        if (argId && !argId.toString().startsWith("new_")) {
            domIds.push(parseInt(argId));
        }
    }
    
    // IDs a eliminar (existen en backend pero no en DOM)
    const toDeleteIds = existingIds.filter(id => !domIds.includes(id));
    
    // Eliminar argumentos que ya no están en el DOM
    for (const id of toDeleteIds) {
        try {
            await deleteArgument(id);
            console.log(`Deleted argument ${id}`);
        } catch (err) {
            console.error(`Error deleting argument ${id}:`, err);
        }
    }
    
    // Actualizar o crear los argumentos que están en DOM
    // Primero, ordenar por posición
    const itemsArray = Array.from(currentArgumentItems);
    for (let idx = 0; idx < itemsArray.length; idx++) {
        const item = itemsArray[idx];
        const argId = item.dataset.argumentId;
        const nameInput = item.querySelector(".argument-name-input");
        const typeSelect = item.querySelector(".argument-type-select");
        const descInput = item.querySelector(".argument-desc-input");
        const defaultInput = item.querySelector(".argument-default-input");
        
        const name = nameInput?.value?.trim();
        if (!name) continue; // Saltar argumentos sin nombre
        
        const typeName = typeSelect?.value || "str";
        const position = idx;
        const description = descInput?.value || null;
        const defaultValue = defaultInput?.value || null;
        
        if (argId && !argId.toString().startsWith("new_")) {
            // Actualizar argumento existente (nombre, tipo, posición, descripción, valor por defecto)
            try {
                await updateArgument(argId, {
                    name: name,
                    type_name: typeName,
                    position: position,
                    description: description,
                    default_value: defaultValue
                });
                console.log(`Updated argument ${argId}`);
            } catch (err) {
                console.error(`Error updating argument ${argId}:`, err);
            }
        } else {
            // Crear nuevo argumento
            try {
                await createArgument(exerciseId, name, typeName, position);
                console.log(`Created new argument: ${name}`);
            } catch (err) {
                console.error(`Error creating argument ${name}:`, err);
            }
        }
    }
}

/* ==========================================
   CREATE EXERCISE - CONTROLLER
========================================== */

/* Cargar formulario de creación de ejercicio */
export async function loadCreateExercise(subjectId = null,source = "exercises") {
    try {
        console.log("Loading create exercise form");
        const rol = localStorage.getItem("rol");
        
        let offerings = [];
        let allLanguages = await getAllProgrammingLanguages();
        
        // Obtener años académicos para mapear y determinar año actual
        const academicYears = await getAcademicYears();
        const yearMap = new Map(academicYears.map(y => [y.id, `${y.start_year}-${y.end_year}`]));
        
        // Determinar año académico actual
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        let currentAcademicYear = null;
        if (currentMonth >= 9) {
            currentAcademicYear = academicYears.find(y => y.start_year === currentYear && y.end_year === currentYear + 1);
        } else {
            currentAcademicYear = academicYears.find(y => y.start_year === currentYear - 1 && y.end_year === currentYear);
        }
        const currentYearStart = currentAcademicYear ? currentAcademicYear.start_year : currentYear;
        
        if (rol === "admin") {
            // ADMIN: obtener todas las ofertas (sin filtrar aquí, porque en la vista de cursos ya hay selector de año)
            const [allOfferings, allSubjects] = await Promise.all([
                getAllCourseOfferings(),
                getAllSubjects()
            ]);
            
            const subjectMap = new Map();
            allSubjects.forEach(subj => subjectMap.set(subj.id, subj.name));
            
            // Transformar incluyendo año académico
            offerings = allOfferings.map(off => {
                let subjectName = subjectMap.get(off.subject_id) || `Course ${off.id}`;
                let academicYearStr = "";
                if (off.academic_year_id && yearMap.has(off.academic_year_id)) {
                    academicYearStr = yearMap.get(off.academic_year_id);
                } else if (off.academic_year) {
                    academicYearStr = off.academic_year;
                }
                const displayName = academicYearStr ? `${subjectName} (${academicYearStr})` : subjectName;
                return {
                    offering_id: off.id,
                    subject_name: displayName,
                    subject_id: off.subject_id,
                    academic_year: academicYearStr
                };
            });
            
            // Opcional: ordenar por año descendente (más reciente primero)
            offerings.sort((a, b) => {
                const yearA = parseInt(a.academic_year?.split('-')[0]) || 0;
                const yearB = parseInt(b.academic_year?.split('-')[0]) || 0;
                return yearB - yearA;
            });
        } 
        else {
            // PROFESOR: obtener sus ofertas Y FILTRAR POR AÑO ACTUAL O PASADOS
            const teacherOfferings = await getCourseOfferingsByTeacher();
            
            // Filtrar ofertas: solo años <= año actual
            const filteredOfferings = teacherOfferings.filter(off => {
                let offeringYearStart = null;
                if (off.academic_year) {
                    offeringYearStart = parseInt(off.academic_year.split('-')[0]);
                } else if (off.academic_year_id) {
                    const yearObj = academicYears.find(y => y.id === off.academic_year_id);
                    if (yearObj) offeringYearStart = yearObj.start_year;
                }
                // Si no podemos determinar el año, lo incluimos (por si acaso)
                if (offeringYearStart === null) return true;
                return offeringYearStart <= currentYearStart;
            });
            
            // Transformar y enriquecer con año académico
            offerings = filteredOfferings.map(off => {
                let academicYear = off.academic_year;
                if (!academicYear && off.academic_year_id) {
                    academicYear = yearMap.get(off.academic_year_id) || '';
                }
                const subjectName = off.subject_name || `Course ${off.offering_id}`;
                const displayName = academicYear ? `${subjectName} (${academicYear})` : subjectName;
                return {
                    offering_id: off.offering_id,
                    subject_name: displayName,
                    subject_id: off.subject_id,
                    academic_year: academicYear
                };
            });
            
            // Ordenar por año descendente (más reciente primero)
            offerings.sort((a, b) => {
                const yearA = parseInt(a.academic_year?.split('-')[0]) || 0;
                const yearB = parseInt(b.academic_year?.split('-')[0]) || 0;
                return yearB - yearA;
            });
        }
        
        // Construir lista de asignaturas únicas para la vista (solo para el select de curso)
        // Pero ahora las ofertas ya tienen el año en el nombre, así que podemos usar directamente offerings.
        const subjects = offerings.map(off => ({
            id: off.subject_id,
            name: off.subject_name, // ya incluye año
            offering_id: off.offering_id
        }));
        
        // Eliminar duplicados por subject_id (si hay varias ofertas del mismo curso, se mostrarán todas en el select)
        // No eliminamos duplicados porque queremos que aparezcan todas las ofertas (cada una con su año).
        // Pero si quieres agrupar, puedes hacer un Map, pero entonces perderías el año.
        // Dejamos todas las ofertas para que el profesor elija la correcta.
        
        const defaultSubjectId = subjectId ? parseInt(subjectId) : (offerings.length > 0 ? offerings[0].subject_id : null);
        const defaultOffering = offerings.find(o => o.subject_id === defaultSubjectId);
        
        renderCreateExercise(subjects, offerings, allLanguages, defaultSubjectId, defaultOffering?.offering_id,source);
        
    } catch (error) {
        console.error("Error loading create exercise:", error);
        const main = document.querySelector(".content");
        if (main) {
            main.innerHTML = `
                <div class="error-container">
                    <h2>Error loading form</h2>
                    <p>${error.message}</p>
                    <button class="back-btn" data-back="courses">Go Back</button>
                </div>
            `;
        }
    }
}

/* Crear nuevo ejercicio  */
export async function handleCreateExercise(formData) {
    try {
        if (!formData.title || formData.title.trim() === "") {
            return { success: false, error: "Title is required" };
        }
        if (!formData.description || formData.description.trim() === "") {
            return { success: false, error: "Description is required" };
        }
        if (!formData.courseOfferingId) {
            return { success: false, error: "Course is required" };
        }
        if (!formData.deadline) {
            return { success: false, error: "Deadline is required" };
        }
        if (!formData.languageIds || formData.languageIds.length === 0) {
            return { success: false, error: "At least one programming language is required" };
        }
        
        let formattedDeadline = null;
        if (formData.deadline) {
            const localDate = new Date(formData.deadline);
            if (!isNaN(localDate.getTime())) {
                // Convierte a UTC y mantiene la misma hora absoluta
                formattedDeadline = localDate.toISOString().slice(0, 19).replace('T', ' ') + 'Z';
            }
        }
        
        // Obtener return_type (por defecto "int")
        const returnType = formData.return_type || "int";
        
        // 1. Crear el ejercicio (sin test cases)
        const newExercise = await createExercise(
            formData.title.trim(),
            formData.description.trim(),
            formattedDeadline,
            parseInt(formData.courseOfferingId),
            formData.visibility !== false,
            formData.solution || "",
            formData.evaluation_mode || "legacy_stdin",
            formData.return_type || "int"
        );
        
        // 2. Crear los test cases 
        const testCasesToCreate = (formData.testCases || []).filter(tc => 
            tc.expected_output && tc.expected_output.trim() !== ""
        );

        console.log("Creating test cases:", testCasesToCreate.length);

        for (const tc of testCasesToCreate) {
            try {
                const isHidden = !tc.is_visible;
                await createTestCase(
                    newExercise.id,
                    tc.input_data,
                    tc.expected_output,
                    isHidden  
                );
                console.log("Test case created for exercise", newExercise.id, "is_hidden:", isHidden);
            } catch (tcError) {
                console.error("Error creating test case:", tcError);
            }
        }
        
        // 3. Asignar lenguajes
        for (const languageId of formData.languageIds) {
            try {
                await assignLanguageToExercise(newExercise.id, languageId);
            } catch (langError) {
                console.log(`Error assigning language ${languageId}:`, langError);
            }
        }
        
        // 4. Crear argumentos si es modo function_calls y hay argumentos
        if (formData.evaluation_mode === "function_calls" && formData.arguments && formData.arguments.length > 0) {
            const argsList = formData.arguments;
            
            if (argsList.length === 1) {
                const arg = argsList[0];
                try {
                    await createArgument(
                        newExercise.id,
                        arg.name,
                        arg.type || "str",
                        arg.position
                    );
                    console.log(`Created 1 argument: ${arg.name}`);
                } catch (argError) {
                    console.error("Error creating argument:", argError);
                }
            } else if (argsList.length > 1) {
                try {
                    await createArgumentsBulk(newExercise.id, argsList);
                    console.log(`Bulk created ${argsList.length} arguments`);
                } catch (argError) {
                    console.error("Error creating arguments in bulk:", argError);
                    console.log("Falling back to individual argument creation...");
                    for (const arg of argsList) {
                        try {
                            await createArgument(
                                newExercise.id,
                                arg.name,
                                arg.type || "str",
                                arg.position
                            );
                            console.log(`Created argument: ${arg.name}`);
                        } catch (err) {
                            console.error(`Error creating argument ${arg.name}:`, err);
                        }
                    }
                }
            }
        }
        
        // 5. CREAR RÚBRICA
        const rubricData = formData.rubricData;
        if (rubricData?.criteria?.length > 0) {
            try {
                await createRubric(newExercise.id, rubricData.criteria);
                console.log("Rubric created for exercise", newExercise.id);
            } catch (rubricError) {
                console.error("Error creating rubric:", rubricError);
            }
        }
        
        return { success: true, exercise: newExercise, exerciseId: newExercise.id };
        
    } catch (error) {
        console.error("Error creating exercise:", error);
        return { success: false, error: error.message };
    }
}
/* Añadir test case (UI → llamada desde view) */
export function addTestCaseToCreateForm() {
    addTestCaseToCreateFormUI();
}

/* Eliminar test case (UI → llamada desde view) */
export function deleteTestCaseFromCreateForm(testItem) {
    deleteTestCaseFromCreateFormUI(testItem);
}

/* Obtener lenguajes seleccionados */
export function getCreateFormSelectedLanguages() {
    return getCreateFormSelectedLanguagesUI();
}

/* Obtener test cases del formulario */
export function getCreateFormTestCases() {
    return getCreateFormTestCasesUI();
}

/* Alternar lenguaje en formulario */
export function toggleCreateFormLanguage(chip) {
    toggleLanguageInCreateFormUI(chip);
}
/* Obtener argumentos del formulario */
export function getCreateFormArguments() {
    return getCreateFormArgumentsUI();
}
/* Añadir argumento (UI → llamada desde view) */
export function addArgumentToCreateForm() {
    addArgumentToCreateFormUI();
}

/* Eliminar argumento (UI → llamada desde view) */
export function deleteArgumentFromCreateForm(argumentItem) {
    deleteArgumentFromCreateFormUI(argumentItem);
}


/* Cargar modal de duplicar ejercicio */
export async function loadDuplicateExerciseModal(exerciseId, exerciseTitle) {
    try {
        const rol = localStorage.getItem("rol");
        let offerings = [];
        
        if (rol === "admin") {
            // ADMIN: obtener todas las course offerings, asignaturas y años académicos
            const [allOfferings, allSubjects, academicYears] = await Promise.all([
                getAllCourseOfferings(),
                getAllSubjects(),
                getAcademicYears()
            ]);
            
            // Mapa de subject_id -> subject_name
            const subjectMap = new Map();
            allSubjects.forEach(subj => {
                subjectMap.set(subj.id, subj.name);
            });
            
            // Mapa de academic_year_id -> string "start-end"
            const academicYearMap = new Map();
            academicYears.forEach(ay => {
                academicYearMap.set(ay.id, `${ay.start_year}-${ay.end_year}`);
            });
            
            // Transformar al formato esperado, incluyendo año académico en el nombre
            offerings = allOfferings.map(off => {
                let subjectName = subjectMap.get(off.subject_id) || `Course ${off.id}`;
                let academicYearStr = "";
                
                // Intentar obtener el año académico
                if (off.academic_year_id && academicYearMap.has(off.academic_year_id)) {
                    academicYearStr = academicYearMap.get(off.academic_year_id);
                } else if (off.academic_year) {
                    // Si ya viene como string (ej. "2025-2026")
                    academicYearStr = off.academic_year;
                }
                
                // Mostrar con año si está disponible
                const displayName = academicYearStr 
                    ? `${subjectName} (${academicYearStr})`
                    : subjectName;
                
                return {
                    offering_id: off.id,
                    subject_name: displayName,
                    subject_id: off.subject_id,
                    academic_year: academicYearStr
                };
            });
        } else {
            // TEACHER: obtener solo sus ofertas (sin modificar)
            offerings = await getCourseOfferingsByTeacher();
        }
        
        const exercise = await getExerciseById(exerciseId);
        const currentOfferingId = parseInt(exercise.course_offering_id);
        
        console.log("Current offering ID:", currentOfferingId);
        console.log("Available offerings:", offerings);
        
        // Filtrar cursos disponibles (excluir el actual)
        const availableCourses = offerings.filter(off => {
            const offId = parseInt(off.offering_id);
            return offId !== currentOfferingId;
        });
        
        console.log("Available courses after filter:", availableCourses);
        
        if (availableCourses.length === 0) {
            showNotificationController("No hay otros cursos disponibles para duplicar este ejercicio", "error");
            return;
        }
        
        renderDuplicateExerciseModal(exerciseId, exerciseTitle, availableCourses, currentOfferingId);
    } catch (error) {
        console.error("Error loading duplicate modal:", error);
        showNotificationController("Error al cargar el modal de duplicación", "error");
    }
}

/* Confirmar duplicación de ejercicio */
export async function confirmDuplicateExercise(exerciseId, targetOfferingId) {
    try {
        if (!targetOfferingId) {
            throw new Error("Debes seleccionar un curso destino");
        }
        
        // Asegurar que es número
        const offeringId = parseInt(targetOfferingId);
        console.log("Duplicando ejercicio", exerciseId, "al curso", offeringId);
        
        // Verificar que no es el mismo curso (opcional - el backend ya lo valida)
        const exercise = await getExerciseById(exerciseId);
        if (exercise.course_offering_id === offeringId) {
            throw new Error("No puedes duplicar el ejercicio en el mismo curso");
        }
        
        const result = await duplicateExercise(exerciseId, offeringId);
        
        showNotificationController(`Ejercicio duplicado exitosamente en el curso seleccionado`, "success");
        await loadExercises();
        
        return { success: true, exercise: result };
    } catch (error) {
        console.error("Error duplicating exercise:", error);
        showNotificationController(error.message || "Error al duplicar el ejercicio", "error");
        return { success: false, error: error.message };
    }
}

/* Cerrar modal de duplicar */
export function closeDuplicateModalController() {
    closeDuplicateModal();
}



/* ==========================================
   RÚBRICAS (RUBRICS)
========================================== */

/* Obtener rúbrica de un ejercicio (llama a model) */
export async function getRubric(exerciseId) {
    try {
        const rubric = await getRubricByExercise(exerciseId);
        return rubric;
    } catch (error) {
        console.error("Error getting rubric:", error);
        return null;
    }
}

/* Guardar rúbrica (crear o actualizar) */
export async function saveRubric(exerciseId, rubricData) {
    try {
        // Obtener rúbrica existente
        const existingRubric = await getRubricByExercise(exerciseId);
        
        // Convertir criterios a objeto
        const criteriaObj = {};
        (rubricData.criteria || []).forEach(c => {
            if (c.name && c.name.trim()) {
                criteriaObj[c.name.trim()] = c.description || "";
            }
        });
        
        if (existingRubric && existingRubric.id) {
            // Actualizar rúbrica existente
            const updated = await updateRubric(existingRubric.id, {
                criteria: criteriaObj,
                total_score: rubricData.total_score || 100
            });
            return { success: true, rubric: updated, isNew: false };
        } else if (Object.keys(criteriaObj).length > 0) {
            // Crear nueva rúbrica solo si hay criterios
            const newRubric = await createRubric(exerciseId, criteriaObj);
            return { success: true, rubric: newRubric, isNew: true };
        } else {
            // No hay criterios y no existe rúbrica - no hacer nada
            return { success: true, rubric: null, isNew: false };
        }
    } catch (error) {
        console.error("Error saving rubric:", error);
        return { success: false, error: error.message };
    }
}



/* ==========================================
   RUBRIC UI CONTROLLERS (para llamar desde main.js)
========================================== */

/* Añadir criterio a la rúbrica en la UI (creación o edición) */
export function addCriterionToRubricUIController() {
    // Esta función llama a view.js para añadir un criterio visualmente
    addCriterionToRubricUI();
}

/* Eliminar criterio de la rúbrica en la UI */
export function removeCriterionFromRubricUIController(index) {
    removeCriterionFromRubricUI(index);
}

/* Limpiar todos los criterios de la rúbrica en la UI */
export function clearAllRubricCriteriaUIController() {
    clearAllRubricCriteriaUI();
}

/* Actualizar el contador de criterios en la UI */
export function updateRubricCriteriaCountController() {
    updateRubricCriteriaCount();
}

/* Actualizar la advertencia de pesos en la UI */
export function updateRubricWeightWarningController() {
    updateRubricWeightWarning();
}

/* Obtener datos de la rúbrica desde el formulario (para guardar) */
export function getRubricDataFromFormController() {
    return getRubricDataFromForm();
}


// ==========================================
// NOTIFICACIONES 
// ==========================================
/* Obtener notificaciones con detalles */

export async function getNotificationsController() {
    try {
        const data = await getUnreadNotifications();
        console.log("🔔 RAW DATA from backend:", JSON.stringify(data, null, 2)); 
        // Verificar si cada notificación tiene sender_id
        if (data.notifications && data.notifications.length > 0) {
            data.notifications.forEach((notif, idx) => {
                console.log(`📨 Notification ${idx}:`, {
                    id: notif.id,
                    sender_id: notif.sender_id,
                    sender_name: notif.sender_name,
                    has_sender_id: !!notif.sender_id,
                    has_sender_name: !!notif.sender_name
                });
            });
        }
        // Ahora data.notifications es un array de mensajes individuales
        const notifications = (data.notifications || []).map(notif => ({
            id: notif.id,
            message_id: notif.message_id || notif.id,
            sender_id: notif.sender_id,
            sender_name: notif.sender_name,
            sender_role: notif.sender_role,
            message: notif.message,
            message_preview: notif.message,
            created_at: notif.created_at,
            is_read: notif.is_read || false
        }));
        console.log("📦 Processed notifications:", notifications);
        return {
            notifications: notifications,
            unread_count: data.total_unread || 0
        };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { notifications: [], unread_count: 0 };
    }
}

/* Marcar un mensaje específico como leído */
export async function markSingleMessageAsReadController(messageId) {
    try {
        await markMessageAsRead(messageId);
        await updateNotificationsBadge();
        
        // Recargar el dropdown si está abierto
        const dropdown = document.getElementById("notificationsDropdown");
        if (dropdown && !dropdown.classList.contains("hidden")) {
            await loadAndRenderNotifications();
        }
        
        return true;
    } catch (error) {
        console.error("Error marking message as read:", error);
        return false;
    }
}

/* Actualizar el badge de notificaciones */
export async function updateNotificationsBadge() {
    try {
        const data = await getUnreadCount(); // Esto usa /chat/unread-count
        const badge = document.getElementById("notificationsBadge");
        if (badge) {
            if (data.unread_count > 0) {
                badge.textContent = data.unread_count > 99 ? "99+" : data.unread_count;
                badge.classList.remove("hidden");
            } else {
                badge.classList.add("hidden");
            }
        }
        
        // Si el dropdown está abierto, recargar las notificaciones
        const dropdown = document.getElementById("notificationsDropdown");
        if (dropdown && !dropdown.classList.contains("hidden")) {
            await loadAndRenderNotifications();
        }
        
        return data.unread_count;
    } catch (error) {
        console.error("Error updating badge:", error);
        return 0;
    }
}

/* Cargar y renderizar notificaciones */
export async function loadAndRenderNotifications() {
    const data = await getNotificationsController();
    renderNotificationsDropdownView(data.notifications, data.unread_count);
}

/* Abrir/cerrar dropdown */
export function toggleNotificationsDropdown() {
    const dropdown = document.getElementById("notificationsDropdown");
    if (dropdown) {
        if (dropdown.classList.contains("hidden")) {
            loadAndRenderNotifications();
        }
        dropdown.classList.toggle("hidden");
    }
}

export function closeNotificationsDropdown() {
    const dropdown = document.getElementById("notificationsDropdown");
    if (dropdown) {
        dropdown.classList.add("hidden");
    }
}

/* Manejar clic en notificación */
export async function handleNotificationClick(senderId, senderName, messageId = null) {
    // Solo marcar el mensaje específico como leído, NO toda la conversación
    if (messageId) {
        await markSingleMessageAsReadController(messageId);
    }
    
    closeNotificationsDropdown();
    await updateNotificationsBadge();
    await loadChatController(senderId, senderName);
}

/* Inicializar sistema de notificaciones */
export async function initNotifications() {
    await updateNotificationsBadge();
    
    // Esperar a que el WebSocket esté conectado antes de registrar el callback
    setTimeout(async () => {
        try {
            // Asegurar que el WebSocket está conectado
            await connectChatWebSocket();
            
            // Registrar el callback de una manera que NO sobreescriba el existente
            onWebSocketMessage(async (message) => {
                console.log("Notification received:", message.type);
                
                if (message.type === "notification" || message.type === "message") {
                    await updateNotificationsBadge();
                    
                    // Mostrar notificación del sistema si está permitido
                    if (Notification.permission === "granted" && document.hidden) {
                        new Notification(message.title || "New message", {
                            body: message.body || `${message.sender_name}: ${message.message_preview || "New message"}`,
                            icon: "/src/img/notificacion.png"
                        });
                    }
                }
                
                // NUEVO: Manejar mensaje eliminado
                if (message.type === "message_deleted") {
                    console.log("Message deleted notification received");
                    await updateNotificationsBadge();
                    
                    // Recargar dropdown si está abierto
                    const dropdown = document.getElementById("notificationsDropdown");
                    if (dropdown && !dropdown.classList.contains("hidden")) {
                        await loadAndRenderNotifications();
                    }
                }
            });
        } catch (error) {
            console.error("Error setting up notification WebSocket:", error);
        }
    }, 1000);
}

/* ==========================================
   COURSE STUDENTS
========================================== */

export async function loadCourseStudents(offeringId) {
    try {
        const rol = localStorage.getItem("rol");
        
        if (rol !== "teacher" && rol !== "admin" && rol !== "student") {
            showNotificationController("No tienes permiso para ver esta página", "error");
            loadCourseExercises(offeringId, "courses");
            return;
        }
        
        const validOfferingId = parseInt(offeringId);
        let subjectName = "";
        let isTutor = false;
        
        if (rol === "teacher") {
            const offerings = await getCourseOfferingsByTeacher();
            const offering = offerings.find(o => Number(o.offering_id) === validOfferingId);
            if (offering) {
                subjectName = offering.subject_name;
            } else {
                const allOfferings = await getAllCourseOfferings();
                const found = allOfferings.find(o => o.id === validOfferingId);
                if (found && found.subject) subjectName = found.subject.name;
            }
            isTutor = await checkIfTutor(validOfferingId);
        } 
        else if (rol === "admin") {
            // ADMIN: obtener el nombre del curso correctamente
            const allOfferings = await getAllCourseOfferings();
            const offering = allOfferings.find(o => o.id === validOfferingId);
            if (offering && offering.subject) {
                subjectName = offering.subject.name;
            } else if (offering && offering.subject_name) {
                subjectName = offering.subject_name;
            } else {
                // Fallback: intentar obtener la asignatura por subject_id
                if (offering && offering.subject_id) {
                    const subjects = await getAllSubjects();
                    const subject = subjects.find(s => s.id === offering.subject_id);
                    subjectName = subject ? subject.name : `Curso ${validOfferingId}`;
                } else {
                    subjectName = `Curso ${validOfferingId}`;
                }
            }
            isTutor = true;
        }
        else if (rol === "student") {
            const enrollments = await getMyEnrollments();
            let found = false;
            for (const enrollment of enrollments) {
                for (const course of enrollment.courses || []) {
                    if (Number(course.offering_id) === validOfferingId) {
                        subjectName = course.course_name;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            isTutor = false;
        }
        
        if (!subjectName) {
            console.error("No se encontró la asignatura para el offeringId:", offeringId);
            showNotificationController("No se pudo identificar el curso", "error");
            loadCourseExercises(offeringId, "courses");
            return;
        }
        
        currentOfferingId = validOfferingId;
        currentSubjectId = validOfferingId;
        currentSubjectName = subjectName;
        
        const studentsData = await getStudentsByCourseOfferingEnrollments(validOfferingId);
        const unreadData = await getUnreadCount();
        
        renderCourseStudents(
            studentsData.students || [],
            subjectName,
            validOfferingId,
            validOfferingId,
            unreadData.unread_count || 0,
            rol,
            isTutor
        );
        
    } catch (error) {
        console.error("Error loading course students:", error);
        showNotificationController("Error al cargar los estudiantes: " + error.message, "error");
        loadCourseExercises(offeringId, "courses");
    }
}


// ==========================================
// ENROLL STUDENT CONTROLLERS
// ==========================================

let currentOfferingId = null;
let currentSubjectId = null;

/* Abrir modal de matricular estudiante */
export async function openEnrollStudentModal(offeringId, subjectId) {
    try {
        const rol = localStorage.getItem("rol");
        // Solo teacher con isTutor o admin pueden matricular
        if (rol !== "teacher" && rol !== "admin") {
            showNotificationController("No tienes permiso para matricular estudiantes", "error");
            return;
        }
        
        currentOfferingId = offeringId;
        currentSubjectId = subjectId;
        
        // Obtener nombre de la asignatura
        let subjectName = "";
        if (rol === "admin") {
            const allOfferings = await getAllCourseOfferings();
            const offering = allOfferings.find(o => o.id === parseInt(offeringId));
            subjectName = offering?.subject?.name || offering?.subject_name || "Curso";
        } else {
            const subjects = await getAllSubjects();
            const subject = subjects.find(s => s.id === parseInt(subjectId));
            subjectName = subject?.name || "Curso";
        }
        
        renderEnrollStudentModal(offeringId, subjectId, subjectName);
        
        // Cargar estudiantes no matriculados
        await searchNotEnrolledStudents("");
        
        // Configurar búsqueda en tiempo real
        const searchInput = document.getElementById("enrollStudentSearch");
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener("input", (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    await searchNotEnrolledStudents(e.target.value);
                }, 300);
            });
        }
        
        // Configurar botones de cierre (SOLO estos cierran el modal)
        const closeBtn = document.querySelector(".close-enroll-modal");
        if (closeBtn) closeBtn.addEventListener("click", () => closeEnrollModal());
        const closeFooterBtn = document.querySelector(".close-enroll-modal-btn");
        if (closeFooterBtn) closeFooterBtn.addEventListener("click", () => closeEnrollModal());
        

    } catch (error) {
        console.error("Error opening enroll modal:", error);
        showNotificationController("Error al cargar el modal de matriculación", "error");
    }
}
async function searchNotEnrolledStudents(searchTerm) {
    try {
        showEnrollModalLoading();
        
        const response = await searchStudentsNotEnrolled(searchTerm, currentOfferingId);
        let students = response.students || [];
        
        if (searchTerm && searchTerm.trim() !== "") {
            const searchLower = searchTerm.trim().toLowerCase();
            students = students.filter(student => {
                const name = student.name.toLowerCase();
                const email = student.email.toLowerCase();
                
                // 1. Buscar en el nombre completo
                const fullNameMatches = name.startsWith(searchLower);
                
                // 2. Dividir el nombre en palabras
                const nameWords = name.split(/\s+/);
                const anyWordMatches = nameWords.some(word => word.startsWith(searchLower));
                
                // 3. Buscar en email
                const emailMatches = email.startsWith(searchLower);
                
                return fullNameMatches || anyWordMatches || emailMatches;
            });
        }
        
        renderEnrollStudentsList(students, currentOfferingId);
        
    } catch (error) {
        console.error("Error searching students:", error);
        const container = document.getElementById("enrollStudentsList");
        if (container) {
            container.innerHTML = `
                <div class="enroll-error">
                    <p>⚠️ Error loading students: ${error.message}</p>
                    <button class="retry-btn" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }
}


export async function confirmEnrollStudent(studentId, studentName, offeringId) {
    try {
        // Obtener el año académico actual
        const academicYears = await getAcademicYears();
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        let currentAcademicYear = null;
        
        if (currentMonth >= 9) {
            currentAcademicYear = academicYears.find(y => 
                y.start_year === currentYear && y.end_year === currentYear + 1
            );
        } else {
            currentAcademicYear = academicYears.find(y => 
                y.start_year === currentYear - 1 && y.end_year === currentYear
            );
        }
        
        if (!currentAcademicYear) {
            throw new Error("No active academic year found");
        }
        
        // Matricular al estudiante
        await enrollStudentInCourse(studentId, offeringId, currentAcademicYear.id);
        
        showNotificationController(`${studentName} has been enrolled successfully!`, "success");
        
        // Cerrar modal
        closeEnrollModal();
        
        // Recargar la lista de estudiantes
        await loadCourseStudents(currentSubjectId);
        
    } catch (error) {
        console.error("Error enrolling student:", error);
        showNotificationController(error.message || "Error enrolling student", "error");
    }
}

/* Verificar si el profesor actual es tutor de una course offering */
export async function checkIfTutor(courseOfferingId) {
    try {
        const rol = localStorage.getItem("rol");
        if (rol === "admin") return true; // ADMIN es siempre tutor
        
        const tutors = await getTutorsByCourseOffering(courseOfferingId);
        const myProfile = await getMyProfile();
        const currentUserId = myProfile.id;
        if (!currentUserId) return false;
        return tutors.some(tutor => Number(tutor.professor_id) === Number(currentUserId));
    } catch (error) {
        console.error("Error checking if tutor:", error);
        return false;
    }
}
/* Desmatricular un estudiante de una course offering */
export async function unenrollStudentController(enrollmentId, studentName) {
    try {
        // Llamar al model para eliminar la matrícula
        await deleteEnrollment(enrollmentId);
        
        showNotificationController(`${studentName} has been unenrolled successfully!`, "success");
        
        // Recargar la lista de estudiantes usando el subjectId guardado
        if (currentSubjectId) {
            await loadCourseStudents(currentSubjectId);
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error unenrolling student:", error);
        showNotificationController(error.message || "Error unenrolling student", "error");
        return { success: false, error: error.message };
    }
}
let currentSubjectName = null;

/* Abrir modal de confirmación para desmatricular */
export function openUnenrollConfirmModal(enrollmentId, studentName, subjectName) {
    renderUnenrollConfirmModal(studentName, subjectName, enrollmentId);
}
/* Confirmar desmatriculación y ejecutar */
export async function confirmUnenrollStudent(enrollmentId, studentName) {
    try {
        await deleteEnrollment(enrollmentId);
        
        showNotificationController(`${studentName} has been unenrolled successfully!`, "success");
        
        // Cerrar modal
        closeUnenrollModal();
        
        // Recargar la lista de estudiantes
        if (currentSubjectId) {
            await loadCourseStudents(currentSubjectId);
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error unenrolling student:", error);
        showNotificationController(error.message || "Error unenrolling student", "error");
        closeUnenrollModal();
        return { success: false, error: error.message };
    }
}

/* Cerrar modal de desmatriculación */
export async function closeUnenrollModalController() {
    closeUnenrollModal();  
}


/* Exportar estudiantes a CSV */
export async function exportStudentsCSVController(offeringId) {
    try {
        const students = await getStudentsByCourseOfferingEnrollments(offeringId);
        
        // Convertir a CSV
        const csvRows = [];
        csvRows.push(['ID', 'Name', 'Email', 'Enrollment Date']);
        
        for (const student of students.students || []) {
            csvRows.push([
                student.id,
                student.name,
                student.email || '',
                student.enrollment_date || ''
            ]);
        }
        
        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${offeringId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotificationController("Export completed!", "success");
    } catch (error) {
        console.error("Error exporting students:", error);
        showNotificationController("Error exporting students", "error");
    }
}

/* Ver perfil de estudiante */
export async function viewStudentProfileController(studentId, studentName) {
    try {
        const user = await getUserById(studentId);
        // Cargar perfil del estudiante (puedes crear una vista específica)
        loadMyProfile(); // O crear una vista de perfil de estudiante
    } catch (error) {
        console.error("Error loading student profile:", error);
        showNotificationController("Error loading student profile", "error");
    }
}

/* Descargar plantilla de matrículas */
export async function downloadEnrollmentsTemplateController() {
    try {
        const blob = await downloadEnrollmentsTemplate();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plantilla_matriculas.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showNotificationController("Plantilla descargada correctamente", "success");
    } catch (error) {
        console.error("Error downloading enrollments template:", error);
        showNotificationController("Error al descargar la plantilla", "error");
    }
}

/* Subir archivo Excel de matrículas (solo estudiantes existentes) */
export async function uploadEnrollmentsExcelController(file, offeringId) {
    try {
        if (!file) {
            showNotificationController("Selecciona un archivo Excel", "error");
            return { success: false };
        }
        
        const result = await uploadEnrollmentsExcel(file);
        
        const successCount = result.created_count || 0;
        const errorCount = result.errors?.length || 0;
        
        if (successCount > 0) {
            showNotificationController(`${successCount} estudiantes matriculados${errorCount > 0 ? `, ${errorCount} errores` : ''}`, 
                errorCount > 0 ? "warning" : "success");
        } else {
            showNotificationController("No se realizaron matrículas. Verifica el archivo.", "warning");
        }
        
        // Recargar la lista de estudiantes del curso
        if (offeringId) {
            await loadCourseStudents(offeringId);
        }
        
        return result;
    } catch (error) {
        console.error("Error uploading enrollments excel:", error);
        showNotificationController(error.message || "Error al subir el archivo", "error");
        return { success: false, error: error.message };
    }
}

/* Subir archivo Excel con creación automática de usuarios */
export async function uploadEnrollmentsWithUsersExcelController(file, offeringId) {
    try {
        const rol = localStorage.getItem("rol");
        if (rol !== "admin") 
        {
            showNotificationController("Solo los administradores pueden importar con creación de usuarios", "error");
            return { success: false };
        }
        if (!file) {
            showNotificationController("Selecciona un archivo Excel", "error");
            return { success: false };
        }
        
        const result = await uploadEnrollmentsWithUsersExcel(file);
        
        const successCount = result.created_count || 0;
        const errorCount = result.errors?.length || 0;
        
        if (successCount > 0) {
            showNotificationController(`${successCount} estudiantes matriculados (usuarios creados si no existían)${errorCount > 0 ? `, ${errorCount} errores` : ''}`, 
                errorCount > 0 ? "warning" : "success");
        } else {
            showNotificationController("No se realizaron matrículas. Verifica el archivo.", "warning");
        }
        
        if (offeringId) {
            await loadCourseStudents(offeringId);
        }
        
        return result;
    } catch (error) {
        console.error("Error uploading enrollments with users:", error);
        showNotificationController(error.message || "Error al subir el archivo", "error");
        return { success: false, error: error.message };
    }
}

// ==========================================
// SEARCH CONTROLLERS 
// ==========================================

/* Buscar cursos (filtro en tiempo real) */
export function searchCoursesController(searchTerm) {
    const cards = document.querySelectorAll(".course-card");
    const searchLower = searchTerm.toLowerCase();
    
    cards.forEach(card => {
        const subjectName = card.dataset.subjectName;
        
        if (!subjectName) return;
        
        let matches = false;
        
        if (searchTerm.trim() === "") {
            matches = true;
        } else {
            // 1. Buscar en el nombre completo del curso
            const fullNameMatches = subjectName.startsWith(searchLower);
            
            // 2. Dividir el nombre en palabras (ej: "Advanced Programming" -> ["Advanced", "Programming"])
            const nameWords = subjectName.split(/\s+/);
            const anyWordMatches = nameWords.some(word => word.startsWith(searchLower));
            
            matches = fullNameMatches || anyWordMatches;
        }
        
        card.style.display = matches ? "" : "none";
    });
}

/* Buscar estudiantes (filtro en tiempo real) */
export function searchStudentsController(searchTerm) {
    const rows = document.querySelectorAll("#studentsTableBody tr");
    const searchLower = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const nameCell = row.querySelector(".student-name");
        const idCell = row.querySelector(".student-id-cell");
        const emailCell = row.querySelector(".student-email-cell");
        const name = nameCell?.textContent.toLowerCase() || "";
        const id = idCell?.textContent.toLowerCase() || "";
        const email = emailCell?.textContent.toLowerCase() || "";
        
        let matches = false;
        
        if (searchTerm.trim() === "") {
            matches = true;
        } else {
            // 1. Buscar en el nombre completo
            const fullNameMatches = name.startsWith(searchLower);
            
            // 2. Dividir el nombre en palabras y buscar en cada palabra
            const nameWords = name.split(/\s+/);
            const anyWordMatches = nameWords.some(word => word.startsWith(searchLower));
            
            // 3. Buscar en ID y email
            const idMatches = id.startsWith(searchLower);
            const emailMatches = email.startsWith(searchLower);
            
            matches = fullNameMatches || anyWordMatches || idMatches || emailMatches;
        }
        
        row.style.display = matches ? "" : "none";
    });
}

/* Manejar cambio de modo de evaluación en creación de ejercicio */
export function handleEvaluationModeChangeController() {
    // Ahora siempre es function_calls, así que mostramos la sección de argumentos
    const isCreatePage = document.querySelector(".create-exercise-page") !== null;
    const isEditPage = document.querySelector(".edit-exercise-page") !== null;

    if (isCreatePage) {
        const argumentsSection = document.getElementById("argumentsSection");
        if (argumentsSection) argumentsSection.style.display = "block";
        const solutionHint = document.getElementById("solutionHint");
        if (solutionHint) {
            solutionHint.textContent = "Function signature: function solution(arg1, arg2, ...)";
        }
    } else if (isEditPage) {
        const argumentsSection = document.getElementById("editArgumentsSection");
        if (argumentsSection) argumentsSection.style.display = "block";
        const solutionHint = document.getElementById("editSolutionHint");
        if (solutionHint) {
            solutionHint.textContent = "Function signature: function solution(arg1, arg2, ...)";
        }
        // Si estamos en edición, cargar argumentos existentes
        const exerciseIdElem = document.querySelector(".edit-exercise-page")?.dataset.exerciseId;
        if (exerciseIdElem) {
            loadArgumentsForEditForm(exerciseIdElem);
        }
    }
}
// Función auxiliar para cargar argumentos en edición (si no existe, añádela)
export async function loadArgumentsForEditForm(exerciseId) {
    try {
        const argumentsData = await getArgumentsByExercise(exerciseId);
        renderEditExerciseArguments(argumentsData);
    } catch (error) {
        console.error("Error loading arguments for edit form:", error);
        renderEditExerciseArguments([]);
    }
}
// ==========================================
// EXPORT STUDENTS TO CSV 
// ==========================================

export async function exportCourseStudentsCSVController(offeringId, subjectName) {
    try {
        // 1. Obtener datos de estudiantes desde el modelo
        const studentsData = await getStudentsByCourseOfferingEnrollments(offeringId);
        const students = studentsData.students || [];
        
        if (students.length === 0) {
            showNotificationController("No hay estudiantes para exportar en este curso", "warning");
            return;
        }
        
        // 2. Preparar datos para CSV
        const csvRows = [];
        
        // Headers del CSV (en español para mejor comprensión)
        csvRows.push([
            'ID',
            'Nombre Completo',
            'Email',
            'Fecha de Matrícula',
            'Estado'
        ]);
        
        // Datos de cada estudiante
        for (const student of students) {
            csvRows.push([
                student.id,
                student.name || '',
                student.email || '',
                student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString('es-ES') : '',
                'Activo'
            ]);
        }
        
        // 3. Convertir a CSV
        const csvContent = csvRows.map(row => 
            row.map(cell => {
                // Escapar comillas y caracteres especiales
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',')
        ).join('\n');
        
        // 4. Añadir BOM para UTF-8 (para que Excel lo lea bien)
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // 5. Descargar archivo
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeSubjectName = subjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        a.download = `estudiantes_${safeSubjectName}_${date}.csv`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotificationController(`Exportados ${students.length} estudiantes correctamente`, "success");
        
    } catch (error) {
        console.error("Error exporting students to CSV:", error);
        showNotificationController("Error al exportar estudiantes", "error");
    }
}

// ==========================================
// DUPLICATE COURSE OFFERING CONTROLLERS
// ==========================================

// Estado del modal
let duplicateOfferingState = {
    currentStep: 1,
    selectedOffering: null,
    selectedOfferingData: null,
    targetYearId: null,
    targetYearName: null,
    offeringsByYear: {},
    sortedYears: [],
    allOfferings: []
};

/* Abrir modal para duplicar asignatura */
export async function openDuplicateCourseOfferingModal() {
    try {
        const offerings = await getOfferingsAvailableForDuplicate();
        const academicYears = await getAcademicYears();
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        // Determinar año académico actual
        let currentAcademicYear = null;
        
        if (currentMonth >= 9) {
            currentAcademicYear = academicYears.find(y => 
                y.start_year === currentYear && y.end_year === currentYear + 1
            );
        } else {
            currentAcademicYear = academicYears.find(y => 
                y.start_year === currentYear - 1 && y.end_year === currentYear
            );
        }
        
        // ============ TARGET ACADEMIC YEARS: AÑO ACTUAL Y FUTUROS ============
        const targetAcademicYears = academicYears.filter(year => {
            if (!currentAcademicYear) return true;
            // SOLO año actual y futuros (start_year >= currentAcademicYear.start_year)
            return year.start_year >= currentAcademicYear.start_year;
        }).sort((a, b) => {
            // Orden ascendente (2025-2026, 2026-2027...)
            return a.start_year - b.start_year;
        });
        
        // ============ PARA LOS TABS DE AÑOS ORIGEN: años actuales y pasados ============
        const currentYearStart = currentAcademicYear ? currentAcademicYear.start_year : currentYear;
        
        const filteredOfferings = offerings.filter(offering => {
            // Obtener el año de la offering
            let offeringYear = null;
            if (offering.academic_year) {
                offeringYear = parseInt(offering.academic_year.split('-')[0]);
            } else if (offering.academic_year_start) {
                offeringYear = offering.academic_year_start;
            } else if (offering.start_year) {
                offeringYear = offering.start_year;
            }
            
            return offeringYear && offeringYear <= currentYearStart;
        });
        
        if (filteredOfferings.length === 0) {
            showNotificationController("No hay asignaturas de años pasados disponibles para duplicar", "warning");
            return;
        }
        
        if (targetAcademicYears.length === 0) {
            showNotificationController("No hay años académicos destino disponibles", "warning");
            return;
        }
        
        // Agrupar ofertas filtradas por año
        const offeringsByYear = {};
        filteredOfferings.forEach(offering => {
            let yearKey = "";
            
            if (offering.academic_year) {
                yearKey = offering.academic_year;
            }
            else if (offering.academic_year_start && offering.academic_year_end) {
                yearKey = `${offering.academic_year_start}-${offering.academic_year_end}`;
            }
            else if (offering.start_year && offering.end_year) {
                yearKey = `${offering.start_year}-${offering.end_year}`;
            }
            else if (offering.academic_year_name) {
                yearKey = offering.academic_year_name;
            }
            else {
                yearKey = "Unknown Year";
            }
            
            if (!offeringsByYear[yearKey]) {
                offeringsByYear[yearKey] = [];
            }
            offeringsByYear[yearKey].push(offering);
        });
        
        const sortedYears = Object.keys(offeringsByYear).sort((a, b) => {
            if (a === "Unknown Year") return 1;
            if (b === "Unknown Year") return -1;
            const yearA = parseInt(a.split('-')[0]);
            const yearB = parseInt(b.split('-')[0]);
            return yearB - yearA;
        });

        // Guardar estado
        duplicateOfferingState = {
            currentStep: 1,
            selectedOffering: null,
            selectedOfferingData: null,
            targetYearId: null,
            targetYearName: null,
            offeringsByYear: offeringsByYear,
            sortedYears: sortedYears,
            allOfferings: filteredOfferings,
            targetAcademicYears,
            currentAcademicYear
        };
        
        // Renderizar modal
        renderDuplicateCourseOfferingModal(filteredOfferings, targetAcademicYears, currentAcademicYear);
        
    } catch (error) {
        console.error("Error opening duplicate offering modal:", error);
        showNotificationController("Error al cargar las asignaturas para duplicar", "error");
    }
}

/* Manejar cambio de año en el selector de años */
export function handleDuplicateOfferingYearChange(year) {
    console.log("Año seleccionado:", year);
    console.log("offeringsByYear disponible:", duplicateOfferingState.offeringsByYear);
    console.log("Claves disponibles:", Object.keys(duplicateOfferingState.offeringsByYear));
    
    if (year === "all") {
        // Mostrar TODAS las ofertas de todos los años
        const allOfferingsList = [];
        Object.values(duplicateOfferingState.offeringsByYear).forEach(offerings => {
            allOfferingsList.push(...offerings);
        });
        
        // Actualizar la lista con todas las ofertas
        const overlay = document.querySelector("#duplicateOfferingModalOverlay");
        const offeringsList = overlay?.querySelector("#offeringsList");
        if (offeringsList) {
            // Necesitamos importar renderOfferingsList o usar la función de view
            // Por ahora, llamamos a la función que actualiza la lista en view
            updateDuplicateOfferingOfferingsList(year, duplicateOfferingState.offeringsByYear);
        }
        
        // Actualizar tabs visualmente
        document.querySelectorAll('.duplicate-year-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.year === 'all') {
                tab.classList.add('active');
            }
        });
    } 
    else if (duplicateOfferingState.offeringsByYear[year]) {
        updateDuplicateOfferingOfferingsList(year, duplicateOfferingState.offeringsByYear);
        
        // Actualizar tabs visualmente
        document.querySelectorAll('.duplicate-year-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.year === year) {
                tab.classList.add('active');
            }
        });
    } else {
        console.log("No offerings found for year:", year);
        console.log("Available years:", Object.keys(duplicateOfferingState.offeringsByYear));
        
        // Mostrar mensaje de que no hay ofertas
        const overlay = document.querySelector("#duplicateOfferingModalOverlay");
        const offeringsList = overlay?.querySelector("#offeringsList");
        if (offeringsList) {
            offeringsList.innerHTML = `
                <div class="empty-offerings-message">
                    <p>No course offerings available for ${year}</p>
                </div>
            `;
        }
    }
}
/* Manejar selección de una oferta */
export function handleDuplicateOfferingSelect(offeringId, offeringName) {
    const selectedOffering = duplicateOfferingState.allOfferings.find(o => o.id === offeringId);
    
    if (selectedOffering) {
        duplicateOfferingState.selectedOffering = selectedOffering;
        duplicateOfferingState.selectedOfferingData = selectedOffering;
        
        // Actualizar UI
        updateDuplicateOfferingModalUI({
            currentStep: duplicateOfferingState.currentStep,
            selectedOffering: selectedOffering,
            targetYearId: duplicateOfferingState.targetYearId,
            targetYearName: duplicateOfferingState.targetYearName
        });
        
        // Marcar tarjeta como seleccionada visualmente
        document.querySelectorAll('.duplicate-offering-card').forEach(card => {
            const cardId = parseInt(card.dataset.offeringId);
            if (cardId === offeringId) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }
}

/* Manejar cambio de año destino */
export function handleDuplicateOfferingTargetYearChange(targetYearId) {
    const selectElement = document.getElementById("targetAcademicYearSelect");
    
    // Si targetYearId es vacío o la opción por defecto, resetear
    let targetYearName = "";
    let validTargetYearId = null;
    
    if (targetYearId && targetYearId !== "") {
        const selectedOption = selectElement?.options[selectElement.selectedIndex];
        targetYearName = selectedOption?.text || "";
        validTargetYearId = targetYearId;
    }
    
    console.log("Año destino seleccionado - ID:", validTargetYearId, "Nombre:", targetYearName);
    
    duplicateOfferingState.targetYearId = validTargetYearId;
    duplicateOfferingState.targetYearName = targetYearName;
    
    // Asegurar que se actualice correctamente el estado en la UI
    updateDuplicateOfferingModalUI({
        currentStep: duplicateOfferingState.currentStep,
        selectedOffering: duplicateOfferingState.selectedOffering,
        targetYearId: validTargetYearId,
        targetYearName: targetYearName
    });
}
/* Ir al siguiente paso */
export function duplicateOfferingNextStep() {
    if (duplicateOfferingState.currentStep === 1 && !duplicateOfferingState.selectedOffering) {
        showNotificationController("Por favor, selecciona una asignatura origen", "warning");
        return;
    }
    
    if (duplicateOfferingState.currentStep === 2 && !duplicateOfferingState.targetYearId) {
        showNotificationController("Por favor, selecciona un año académico destino", "warning");
        return;
    }
    
    if (duplicateOfferingState.currentStep < 3) {
        duplicateOfferingState.currentStep++;
        updateDuplicateOfferingModalUI({
            currentStep: duplicateOfferingState.currentStep,
            selectedOffering: duplicateOfferingState.selectedOffering,
            targetYearId: duplicateOfferingState.targetYearId,
            targetYearName: duplicateOfferingState.targetYearName
        });
    }
}

/* Ir al paso anterior */
export function duplicateOfferingPrevStep() {
    if (duplicateOfferingState.currentStep > 1) {
        duplicateOfferingState.currentStep--;
        updateDuplicateOfferingModalUI({
            currentStep: duplicateOfferingState.currentStep,
            selectedOffering: duplicateOfferingState.selectedOffering,
            targetYearId: duplicateOfferingState.targetYearId,
            targetYearName: duplicateOfferingState.targetYearName
        });
    }
}

/* Confirmar duplicación */
export async function confirmDuplicateCourseOffering() {
    if (!duplicateOfferingState.selectedOffering) {
        showNotificationController("No hay asignatura seleccionada", "error");
        return;
    }
    
    if (!duplicateOfferingState.targetYearId) {
        showNotificationController("No hay año destino seleccionado", "error");
        return;
    }
    
    try {
        setConfirmDuplicateButtonLoading(true);
        
        const result = await duplicateCourseOffering(
            duplicateOfferingState.selectedOffering.id, 
            duplicateOfferingState.targetYearId
        );
        
        showNotificationController(`Asignatura duplicada exitosamente al año ${duplicateOfferingState.targetYearName}`, "success");
        
        closeDuplicateOfferingModalController();
        await loadCourses();
        
    } catch (error) {
        console.error("Error duplicating offering:", error);
        showNotificationController(error.message || "Error al duplicar la asignatura", "error");
    } finally {
        setConfirmDuplicateButtonLoading(false);
    }
}

/* Cerrar modal */
export function closeDuplicateOfferingModalController() {
    closeDuplicateOfferingModalView();
    duplicateOfferingState = {
        currentStep: 1,
        selectedOffering: null,
        selectedOfferingData: null,
        targetYearId: null,
        targetYearName: null,
        offeringsByYear: {},
        sortedYears: [],
        allOfferings: [],
        targetAcademicYears: [],
        currentAcademicYear: null
    };
}


// ==========================================
// COURSE PROFESSORS (PROFESORES ASIGNADOS)
// ==========================================

/* Cargar vista de profesores asignados a un curso */
export async function loadCourseProfessors(offeringId) {
    try {
        const rol = localStorage.getItem("rol");
        
        if (rol !== "teacher" && rol !== "admin" && rol !== "student") {
            showNotificationController("No tienes permiso para ver esta página", "error");
            loadCourseExercises(offeringId, "courses");
            return;
        }
        
        const validOfferingId = parseInt(offeringId);
        
        let isTutor = false;
        if (rol === "teacher") {
            isTutor = await checkIfTutor(validOfferingId);
        } else if (rol === "admin") {
            isTutor = true;
        }
        
        let subjectName = "";
        let subjectId = null;
        
        if (rol === "teacher") {
            const offerings = await getCourseOfferingsByTeacher();
            const offering = offerings.find(o => Number(o.offering_id) === validOfferingId);
            if (offering) {
                subjectName = offering.subject_name;
                subjectId = offering.subject_id;
            }
        } else if (rol === "admin") {
            const allOfferings = await getAllCourseOfferings();
            const offering = allOfferings.find(o => o.id === validOfferingId);
            if (offering) {
                // Obtener nombre de la asignatura
                if (offering.subject) {
                    subjectName = offering.subject.name;
                } else if (offering.subject_name) {
                    subjectName = offering.subject_name;
                } else if (offering.subject_id) {
                    const subjects = await getAllSubjects();
                    const subject = subjects.find(s => s.id === offering.subject_id);
                    subjectName = subject ? subject.name : `Curso ${validOfferingId}`;
                } else {
                    subjectName = `Curso ${validOfferingId}`;
                }
                subjectId = offering.subject_id;
            }
        } else if (rol === "student") {
            const enrollments = await getMyEnrollments();
            let found = false;
            for (const enrollment of enrollments) {
                for (const course of enrollment.courses || []) {
                    if (Number(course.offering_id) === validOfferingId) {
                        subjectName = course.course_name;
                        subjectId = course.course_id;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
        }
        
        if (!subjectName) {
            console.error("No se encontró la asignatura para el offeringId:", offeringId);
            showNotificationController("No se pudo identificar el curso", "error");
            loadCourseExercises(offeringId, "courses");
            return;
        }
        
        currentOfferingId = validOfferingId;
        currentSubjectId = validOfferingId;
        currentSubjectName = subjectName;
        
        const professorsData = await getProfessorsByCourseOffering(validOfferingId);
        const professors = professorsData.assignments || [];
        
        let availableProfessors = [];
        if ((rol === "teacher" && isTutor) || rol === "admin") {
            try {
                const availableData = await getAvailableProfessorsForCourse(validOfferingId);
                availableProfessors = availableData.professors || [];
            } catch (err) {
                console.error("Error getting available professors:", err);
            }
        }
        
        const unreadData = await getUnreadCount();
        
        renderCourseProfessors(
            professors,
            availableProfessors,
            subjectName,
            validOfferingId,
            validOfferingId,
            unreadData.unread_count || 0,
            rol,
            isTutor
        );
        
    } catch (error) {
        console.error("Error loading course professors:", error);
        showNotificationController("Error al cargar los profesores: " + error.message, "error");
        loadCourseExercises(offeringId, "courses");
    }
}

/* Asignar un profesor a un curso */
export async function assignProfessorToCourseController(professorEmail, courseOfferingId, isTutor) {
    try {
        if (!professorEmail || professorEmail.trim() === "") {
            showNotificationController("Debes ingresar un email de profesor", "error");
            return { success: false };
        }
        
        const result = await assignProfessorToCourse(professorEmail.trim(), courseOfferingId, isTutor);
        
        showNotificationController(`Profesor asignado exitosamente`, "success");
        
        // Recargar la lista
        await loadCourseProfessors(courseOfferingId);
        
        return { success: true, data: result };
    } catch (error) {
        console.error("Error assigning professor:", error);
        showNotificationController(error.message || "Error al asignar profesor", "error");
        return { success: false, error: error.message };
    }
}

/* Eliminar asignación de un profesor */
export async function removeProfessorAssignmentController(assignmentId, courseOfferingId, professorName) {
    try {
        await deleteTeacherAssignment(assignmentId);
        
        showNotificationController(`Profesor ${professorName} eliminado del curso`, "success");
        
        // Recargar la lista
        await loadCourseProfessors(courseOfferingId);
        
        return { success: true };
    } catch (error) {
        console.error("Error removing assignment:", error);
        showNotificationController(error.message || "Error al eliminar asignación", "error");
        return { success: false, error: error.message };
    }
}

/* Subir Excel de asignaciones */
export async function uploadProfessorsExcelController(file, offeringId) {
    try {
        const result = await uploadTeacherAssignmentsExcel(file);
        
        if (result.errors && result.errors.length > 0) {
            const errorMessages = result.errors.map(e => 
                e.detail || e.message || JSON.stringify(e)
            ).join('; ');
            showNotificationController(
                `Asignaciones importadas: ${result.created_count || 0} creadas, ${result.errors.length} errores: ${errorMessages}`,
                "warning"
            );
        } else {
            showNotificationController(
                `Asignaciones importadas: ${result.created_count || 0} creadas correctamente`,
                "success"
            );
        }
        
        // Recargar la lista de profesores siempre (para reflejar cambios parciales)
        await loadCourseProfessors(offeringId);
        return result;
        
    } catch (error) {
        console.error("Error uploading professors excel:", error);
        showNotificationController(`Error al subir el archivo: ${error.message}`, "error");
        return null;
    }
}



/* Crear múltiples asignaciones (bulk JSON) */
export async function bulkAssignProfessorsController(assignments, offeringId) {
    try {
        if (!assignments || assignments.length === 0) {
            showNotificationController("No hay asignaciones para procesar", "warning");
            return { success: false };
        }
        
        // Validar que cada asignación tenga los campos necesarios
        const validAssignments = [];
        const errors = [];
        
        for (let i = 0; i < assignments.length; i++) {
            const a = assignments[i];
            if (!a.professor_email || !a.professor_email.trim()) {
                errors.push(`Fila ${i + 1}: Email de profesor requerido`);
                continue;
            }
            
            // Buscar el profesor por email para obtener su ID
            try {
                const allTeachers = await getAllTeachers();
                const professor = allTeachers.find(t => t.email === a.professor_email.trim());
                
                if (!professor) {
                    errors.push(`Fila ${i + 1}: Profesor con email "${a.professor_email}" no encontrado`);
                    continue;
                }
                
                validAssignments.push({
                    professor_id: professor.id,
                    course_offering_id: parseInt(offeringId),
                    is_tutor: false
                });
            } catch (err) {
                errors.push(`Fila ${i + 1}: Error buscando profesor - ${err.message}`);
            }
        }
        
        if (validAssignments.length === 0) {
            showNotificationController("No se pudieron procesar asignaciones válidas", "error");
            return { success: false, errors };
        }
        
        // Llamar al endpoint bulk
        const result = await createTeacherAssignmentsBulk(validAssignments);
        
        const successCount = result.length;
        const errorCount = errors.length;
        
        showNotificationController(
            `${successCount} profesor(es) asignado(s) correctamente${errorCount > 0 ? `, ${errorCount} error(es)` : ''}`, 
            errorCount > 0 ? "warning" : "success"
        );
        
        // Recargar la lista de profesores
        await loadCourseProfessors(offeringId);
        
        return { success: true, created: result, errors };
    } catch (error) {
        console.error("Error in bulk assign:", error);
        showNotificationController(error.message || "Error al crear asignaciones", "error");
        return { success: false, error: error.message };
    }
}

/* Buscar en la tabla de profesores (pasa la llamada a view) */
export function searchProfessorsTable(searchTerm) {
    searchProfessorsTableView(searchTerm);
}

/* Abrir modal de Bulk JSON (llama a view para renderizar y pasa callback) */
export function openBulkJsonModal(offeringId) {
    renderBulkJsonModal(offeringId, async (jsonInput, offeringIdModal, closeModal) => {
        try {
            const assignments = JSON.parse(jsonInput);
            if (!Array.isArray(assignments)) throw new Error("Must be an array");
            
            const validAssignments = assignments.map(a => ({
                professor_email: a.professor_email,
                course_offering_id: parseInt(offeringIdModal),
                is_tutor: a.is_tutor === true
            }));
            
            await bulkAssignProfessorsController(validAssignments, offeringIdModal);
            closeModal();
        } catch (error) {
            showNotificationController("Invalid JSON format: " + error.message, "error");
        }
    });
}
/* Descargar plantilla de asignaciones (llama al model y luego al view) */
export async function downloadProfessorsTemplateController() {
    try {
        const blob = await downloadTeacherAssignmentsTemplate();
        downloadProfessorsTemplateUI(blob);
        showNotificationController("Plantilla descargada correctamente", "success");
    } catch (error) {
        console.error("Error downloading template:", error);
        showNotificationController("Error al descargar la plantilla", "error");
    }
}

/* Abrir modal de asignar profesor */
export async function openAssignProfessorModal(offeringId) {
    try {
        // Obtener profesores disponibles (no asignados)
        const availableData = await getAvailableProfessorsForCourse(offeringId);
        const availableProfessors = availableData.professors || [];
        
        // Guardar datos para el filtro
        setAvailableProfessorsData(availableProfessors);
        
        // Renderizar modal
        renderAssignProfessorModal(offeringId, availableProfessors);
        
        // Configurar eventos para los botones de asignación (se manejan en main.js)
        
    } catch (error) {
        console.error("Error opening assign professor modal:", error);
        showNotificationController("Error loading available professors", "error");
    }
}

/* Asignar profesor desde el modal */
export async function assignProfessorFromModal(professorEmail, offeringId, professorName) {
    try {
        if (!professorEmail || professorEmail.trim() === "") {
            showNotificationController("Invalid professor email", "error");
            return { success: false };
        }
        
        // Primero obtener el profesor por email para conseguir su ID
        const allTeachers = await getAllTeachers();
        const professor = allTeachers.find(t => t.email === professorEmail.trim());
        
        if (!professor) {
            showNotificationController("Professor not found with that email", "error");
            return { success: false };
        }
        
        // Usar createTeacherAssignment en lugar de assignProfessorToCourse
        const result = await createTeacherAssignment(professor.id, parseInt(offeringId));
        
        showNotificationController(`Professor ${professorName} assigned successfully!`, "success");
        
        // Cerrar modal
        const modal = document.querySelector(".assign-professor-modal-overlay");
        if (modal) modal.remove();
        
        // Recargar la lista de profesores
        await loadCourseProfessors(offeringId);
        
        return { success: true, data: result };
    } catch (error) {
        console.error("Error assigning professor:", error);
        showNotificationController(error.message || "Error assigning professor", "error");
        return { success: false, error: error.message };
    }
}


/* Abrir modal de confirmación para eliminar profesor */
export function openRemoveProfessorConfirmModal(assignmentId, professorName, subjectName, offeringId) {
    renderRemoveProfessorConfirmModal(professorName, subjectName, assignmentId, offeringId);
}

/* Cerrar modal de eliminación de profesor */
export function closeRemoveProfessorModalController() {
    closeRemoveProfessorModal(); // Llama a la función de view.js
}


/* Confirmar eliminación de profesor */
export async function confirmRemoveProfessor(assignmentId, professorName, courseOfferingId) {
    try {
        await deleteTeacherAssignment(assignmentId);
        
        showNotificationController(`Professor ${professorName} removed from course`, "success");
        
        // Cerrar modal
        closeRemoveProfessorModal();
        
        // Recargar la lista de profesores
        await loadCourseProfessors(courseOfferingId);
        
        return { success: true };
    } catch (error) {
        console.error("Error removing professor:", error);
        showNotificationController(error.message || "Error removing professor", "error");
        closeRemoveProfessorModal();
        return { success: false, error: error.message };
    }
}


/* Cambiar rol de profesor (tutor sí/no) - solo admin */
export async function changeProfessorRoleController(assignmentId, newIsTutor, offeringId, professorName) {
    try {
        // Si se quiere marcar como tutor, verificar que no haya ya un tutor en el curso
        if (newIsTutor === true) {
            const professorsData = await getProfessorsByCourseOffering(offeringId);
            const existingTutor = professorsData.assignments?.find(
                p => p.is_tutor === true && p.assignment_id !== parseInt(assignmentId)
            );
            if (existingTutor) {
                showNotificationController(
                    `Ya existe un tutor en este curso: ${existingTutor.name}. Solo puede haber un tutor.`,
                    "error"
                );
                return { success: false, error: "Ya existe un tutor" };
            }
        }

        await setTutorStatus(assignmentId, newIsTutor);
        showNotificationController(
            `Rol de ${professorName} actualizado a ${newIsTutor ? "Tutor" : "Profesor"}`,
            "success"
        );

        // Recargar la vista de profesores del curso
        await loadCourseProfessors(offeringId);
        return { success: true };
    } catch (error) {
        console.error("Error changing professor role:", error);
        showNotificationController(error.message || "Error al cambiar rol", "error");
        return { success: false, error: error.message };
    }
}

// ==========================================
// ACADEMIC STRUCTURE - ADMIN
// ==========================================

// Estado para la vista académica
let currentAcademicStructureTab = "subjects";
let academicSubjectsData = [];
let academicYearsData = [];
let courseOfferingsData = [];

export async function loadAcademicStructure() {
    const rol = localStorage.getItem("rol");
    
    // Solo admin puede acceder - REDIRIGIR si no es admin
    if (rol !== "admin") {
        showNotificationController("No tienes permiso para acceder a esta sección", "error");
        loadDashboard();  // Redirigir al dashboard
        return;
    }
    
    try {
        // Cargar datos iniciales...
        await Promise.all([
            loadAllSubjectsForAdmin(),
            loadAllAcademicYearsForAdmin(),
            loadAllCourseOfferingsForAdmin()
        ]);
        
        renderAcademicStructure(
            academicSubjectsData,
            academicYearsData,
            courseOfferingsData,
            currentAcademicStructureTab
        );
        
        setActiveMenu(5);
    } catch (error) {
        console.error("Error loading academic structure:", error);
        showNotificationController("Error al cargar la estructura académica", "error");
    }
}
/* Cargar todas las asignaturas para admin */
export async function loadAllSubjectsForAdmin() {
    try {
        const subjects = await getAllSubjects();
        
        // Obtener todas las course offerings para calcular estadísticas
        const offerings = await getAllCourseOfferings();
        
        // Crear un mapa de subject_id a lista de offerings
        const offeringsBySubject = new Map();
        offerings.forEach(offering => {
            if (!offeringsBySubject.has(offering.subject_id)) {
                offeringsBySubject.set(offering.subject_id, []);
            }
            offeringsBySubject.get(offering.subject_id).push(offering);
        });
        
        // Para cada subject, calcular offerings_count y exercises_count
        for (const subject of subjects) {
            const subjectOfferings = offeringsBySubject.get(subject.id) || [];
            subject.offerings_count = subjectOfferings.length;
            
            // Calcular ejercicios totales para este subject
            let totalExercises = 0;
            for (const offering of subjectOfferings) {
                try {
                    const exercises = await getExercisesByOffering(offering.id);
                    totalExercises += exercises.length;
                } catch (err) {
                    console.log(`Error getting exercises for offering ${offering.id}:`, err);
                }
            }
            subject.exercises_count = totalExercises;
        }
        
        academicSubjectsData = subjects;
        return academicSubjectsData;
    } catch (error) {
        console.error("Error loading subjects:", error);
        academicSubjectsData = [];
        return [];
    }
}

/* Cargar todos los años académicos para admin */
export async function loadAllAcademicYearsForAdmin() {
    try {
        const academicYears = await getAcademicYears();
        
        // Obtener todas las course offerings para contar ofertas por año
        const offerings = await getAllCourseOfferings();
        
        // Crear un mapa de academic_year_id a número de ofertas
        const offeringsCountMap = new Map();
        offerings.forEach(offering => {
            const yearId = offering.academic_year_id;
            offeringsCountMap.set(yearId, (offeringsCountMap.get(yearId) || 0) + 1);
        });
        
        // Añadir contador a cada año académico
        const academicYearsWithCount = academicYears.map(year => ({
            ...year,
            offerings_count: offeringsCountMap.get(year.id) || 0
        }));
        
        academicYearsData = academicYearsWithCount;
        return academicYearsData;
    } catch (error) {
        console.error("Error loading academic years:", error);
        academicYearsData = [];
        return [];
    }
}


/* Cargar todas las course offerings */
export async function loadAllCourseOfferingsForAdmin() {
    try {
        const result = await searchCourseOfferings({ limit: 200 });
        courseOfferingsData = result.items || [];
        
        // También actualizar los contadores de subjects cuando se recargan offerings
        if (academicSubjectsData.length > 0) {
            await loadAllSubjectsForAdmin();
        }
        
        return courseOfferingsData;
    } catch (error) {
        console.error("Error loading course offerings:", error);
        courseOfferingsData = [];
        return [];
    }
}


/* Cambiar pestaña en Academic Structure */
export async function changeAcademicStructureTab(tab) {
    currentAcademicStructureTab = tab;
    
    // Recargar datos según la pestaña
    if (tab === "subjects") {
        await loadAllSubjectsForAdmin();  
    } else if (tab === "academicYears") {
        await loadAllAcademicYearsForAdmin();
    } else if (tab === "courseOfferings") {
        await loadAllCourseOfferingsForAdmin();
    }
    
    renderAcademicStructure(
        academicSubjectsData,
        academicYearsData,
        courseOfferingsData,
        currentAcademicStructureTab
    );
}
// ==========================================
// SUBJECTS CRUD (Asignaturas)
// ==========================================

/* Crear asignatura */
export async function createSubjectController(name, description, stayInDashboard = false) {
    try {
        if (!name || name.trim() === "") {
            showNotificationController("El nombre de la asignatura es requerido", "error");
            return { success: false };
        }
        
        const newSubject = await createSubject(name.trim(), description || "");
        
        showNotificationController(`Asignatura "${name}" creada exitosamente`, "success");
        
        if (!stayInDashboard) {
            // Comportamiento normal: recargar según el origen
            if (currentSubjectCreationSource === "courses") {
                await loadCourses();          
            } else {
                await loadAcademicStructure();
            }
        } else {
            // Modo dashboard: solo actualizar el contador de cursos activos en el dashboard
            // Primero, actualizamos la caché de asignaturas si es necesario (opcional)
            const subjects = await getAllSubjects();
            const totalCourses = subjects.length;
            
            // Actualizar el contador "Active Courses" en el dashboard
            const coursesStatElement = document.querySelector(".stat-card:nth-child(2) .stat-number");
            if (coursesStatElement) {
                coursesStatElement.textContent = totalCourses;
            }
            
            // Opcional: si el dashboard muestra más datos relacionados, actualízalos aquí
        }
        
        currentSubjectCreationSource = null;
        return { success: true, subject: newSubject };
        
    } catch (error) {
        console.error("Error creating subject:", error);
        showNotificationController(error.message || "Error al crear asignatura", "error");
        currentSubjectCreationSource = null;
        return { success: false, error: error.message };
    }
}
/* Editar asignatura */
export async function editSubjectController(subjectId, name, description) {
    try {
        if (!name || name.trim() === "") {
            showNotificationController("El nombre de la asignatura es requerido", "error");
            return { success: false };
        }
        
        const updatedSubject = await updateSubject(subjectId, {
            name: name.trim(),
            description: description || ""
        });
        
        showNotificationController(`Asignatura actualizada exitosamente`, "success");
        
        // Recargar la vista
        if (currentAcademicStructureTab === "subjects") {
            await loadAllSubjectsForAdmin();
            renderAcademicStructure(
                academicSubjectsData,
                academicYearsData,
                courseOfferingsData,
                currentAcademicStructureTab
            );
        } else {
            await loadCourses();
        }
        
        return { success: true, subject: updatedSubject };
    } catch (error) {
        console.error("Error updating subject:", error);
        showNotificationController(error.message || "Error al actualizar asignatura", "error");
        return { success: false, error: error.message };
    }
}


/* Actualizar asignatura */
export async function updateSubjectController(subjectId, name, description) {
    try {
        if (!name || name.trim() === "") {
            showNotificationController("El nombre de la asignatura es requerido", "error");
            return { success: false };
        }
        
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        
        const updatedSubject = await updateSubject(subjectId, updateData);
        
        showNotificationController(`Asignatura actualizada exitosamente`, "success");
        
        // Recargar datos
        await loadAllSubjectsForAdmin();
        renderAcademicStructure(
            academicSubjectsData,
            academicYearsData,
            courseOfferingsData,
            currentAcademicStructureTab
        );
        
        return { success: true, subject: updatedSubject };
    } catch (error) {
        console.error("Error updating subject:", error);
        showNotificationController(error.message || "Error al actualizar asignatura", "error");
        return { success: false, error: error.message };
    }
}

/* Eliminar asignatura */
export async function deleteSubjectController(subjectId, subjectName) {
    try {
        await deleteSubject(subjectId);
        
        showNotificationController(`Asignatura "${subjectName}" eliminada exitosamente`, "success");
        
        // Recargar datos
        await loadAllSubjectsForAdmin();
        renderAcademicStructure(
            academicSubjectsData,
            academicYearsData,
            courseOfferingsData,
            currentAcademicStructureTab
        );
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting subject:", error);
        showNotificationController(error.message || "Error al eliminar asignatura", "error");
        return { success: false, error: error.message };
    }
}

/* Subir asignaturas desde Excel */
export async function uploadSubjectsExcelController(file) {
    try {
        if (!file) {
            showNotificationController("Selecciona un archivo Excel", "error");
            return { success: false };
        }
        
        const result = await uploadSubjectsExcel(file);
        
        const successCount = result.created_count || 0;
        const errorCount = result.errors?.length || 0;
        
        if (successCount > 0) {
            showNotificationController(`${successCount} asignaturas creadas${errorCount > 0 ? `, ${errorCount} errores` : ''}`, 
                errorCount > 0 ? "warning" : "success");
        } else {
            showNotificationController("No se crearon asignaturas. Verifica el archivo.", "warning");
        }
        
        // Recargar datos
        await loadAllSubjectsForAdmin();
        renderAcademicStructure(
            academicSubjectsData,
            academicYearsData,
            courseOfferingsData,
            currentAcademicStructureTab
        );
        
        return result;
    } catch (error) {
        console.error("Error uploading subjects excel:", error);
        showNotificationController(error.message || "Error al subir el archivo", "error");
        return { success: false, error: error.message };
    }
}

/* Descargar plantilla de asignaturas */
export async function downloadSubjectsTemplateController() {
    try {
        const blob = await downloadSubjectsTemplate();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plantilla_asignaturas.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showNotificationController("Plantilla descargada correctamente", "success");
    } catch (error) {
        console.error("Error downloading template:", error);
        showNotificationController("Error al descargar la plantilla", "error");
    }
}

// ==========================================
// ACADEMIC YEARS CRUD
// ==========================================

/* Crear año académico */
export async function createAcademicYearController(startYear, endYear) {
    try {
        if (!startYear || !endYear) {
            showNotificationController("Completa ambos años", "error");
            return { success: false };
        }
        
        const start = parseInt(startYear);
        const end = parseInt(endYear);
        
        if (start >= end) {
            showNotificationController("El año de inicio debe ser menor que el año de fin", "error");
            return { success: false };
        }
        
        const newYear = await createAcademicYear(start, end);
        
        showNotificationController(`Año académico ${start}-${end} creado exitosamente`, "success");
        
        await loadAllAcademicYearsForAdmin();
        renderAcademicStructure(
            academicSubjectsData,
            academicYearsData,
            courseOfferingsData,
            currentAcademicStructureTab
        );
        
        return { success: true, year: newYear };
    } catch (error) {
        console.error("Error creating academic year:", error);
        showNotificationController(error.message || "Error al crear año académico", "error");
        return { success: false, error: error.message };
    }
}

/* Actualizar año académico */
export async function updateAcademicYearController(yearId, startYear, endYear) {
    try {
        if (!startYear || !endYear) {
            showNotificationController("Complete both years", "error");
            return { success: false };
        }
        
        const start = parseInt(startYear);
        const end = parseInt(endYear);
        
        if (start >= end) {
            showNotificationController("Start year must be less than end year", "error");
            return { success: false };
        }
        
        const updatedYear = await updateAcademicYear(yearId, start, end);
        
        showNotificationController(`Academic year updated successfully`, "success");
        
        // Recargar la vista académica completa
        await loadAcademicStructure();
        
        return { success: true, year: updatedYear };
        
    } catch (error) {
        console.error("Error updating academic year:", error);
        showNotificationController(error.message || "Error updating academic year", "error");
        return { success: false, error: error.message };
    }
}
/* Eliminar año académico */
export async function deleteAcademicYearController(yearId, yearName) {
    try {
        // Primero verificar si tiene ofertas asociadas
        const offerings = await getAllCourseOfferings();
        const offeringsCount = offerings.filter(o => o.academic_year_id === parseInt(yearId)).length;
        
        // Abrir modal de confirmación (llama a view)
        renderDeleteAcademicYearConfirmModal(yearId, yearName, offeringsCount);
        
    } catch (error) {
        console.error("Error checking academic year:", error);
        showNotificationController("Error verifying academic year", "error");
    }
}

// ==========================================
// COURSE OFFERINGS CRUD
// ==========================================

/* Crear course offering */
export async function createCourseOfferingController(subjectId, academicYearId) {
    try {
        if (!subjectId || !academicYearId) {
            showNotificationController("Selecciona una asignatura y un año académico", "error");
            return { success: false };
        }
        
        const newOffering = await createCourseOffering(parseInt(subjectId), parseInt(academicYearId));
        
        showNotificationController(`Oferta de curso creada exitosamente`, "success");
        
        await loadAllCourseOfferingsForAdmin();
        renderAcademicStructure(
            academicSubjectsData,
            academicYearsData,
            courseOfferingsData,
            currentAcademicStructureTab
        );
        
        return { success: true, offering: newOffering };
    } catch (error) {
        console.error("Error creating course offering:", error);
        showNotificationController(error.message || "Error al crear oferta de curso", "error");
        return { success: false, error: error.message };
    }
}

/* Subir course offerings desde Excel */
export async function uploadCourseOfferingsExcelController(file) {
    try {
        if (!file) {
            showNotificationController("Selecciona un archivo Excel", "error");
            return { success: false };
        }
        
        const result = await uploadCourseOfferingsExcel(file);
        
        const successCount = result.created_count || 0;
        const errorCount = result.errors?.length || 0;
        
        if (successCount > 0) {
            showNotificationController(`${successCount} ofertas creadas${errorCount > 0 ? `, ${errorCount} errores` : ''}`, 
                errorCount > 0 ? "warning" : "success");
        } else {
            showNotificationController("No se crearon ofertas. Verifica el archivo.", "warning");
        }
        
        // Recargar la vista
        await loadAcademicStructure();
        
        return result;
    } catch (error) {
        console.error("Error uploading course offerings excel:", error);
        showNotificationController(error.message || "Error al subir el archivo", "error");
        return { success: false, error: error.message };
    }
}

/* Descargar plantilla de course offerings */
export async function downloadCourseOfferingsTemplateController() {
    try {
        const blob = await downloadCourseOfferingsTemplate();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plantilla_course_offerings.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showNotificationController("Plantilla descargada correctamente", "success");
    } catch (error) {
        console.error("Error downloading template:", error);
        showNotificationController("Error al descargar la plantilla", "error");
    }
}

// ==========================================
// ACADEMIC STRUCTURE - MODAL CONTROLLERS
// ==========================================

let currentSubjectCreationSource = null;
/* Abrir modal para crear asignatura */
export async function openCreateSubjectModalController(source = "academic") {
    currentSubjectCreationSource = source;  
    renderCreateSubjectModal();
}
/* Abrir modal para editar asignatura */
export async function openEditSubjectModalController(subjectId, subjectName, subjectDescription) {
    renderEditSubjectModal(subjectId, subjectName, subjectDescription);
}

/* Cerrar modal de asignatura */
export async function closeSubjectModalController() {
    closeSubjectModal();
}

/* Abrir modal para crear año académico */
export async function openCreateAcademicYearModalController() {
    renderCreateAcademicYearModal();
}

/* Abrir modal para editar año académico */
export async function openEditAcademicYearModalController(yearId, startYear, endYear) {
    renderEditAcademicYearModal(yearId, startYear, endYear);
}

/* Abrir modal para crear course offering */
export async function openCreateCourseOfferingModalController() {
    // Usar las variables globales de academicSubjectsData y academicYearsData
    renderCreateCourseOfferingModal(academicSubjectsData, academicYearsData);
}

/* Cerrar modal académico genérico */
export async function closeAcademicModalController() {
    closeAcademicModal();
}

export function openDeleteSubjectConfirmModal(subjectId, subjectName) {
    renderDeleteSubjectConfirmModal(subjectId, subjectName);
}

/* Cerrar modal de eliminación de asignatura */
export function closeDeleteSubjectModalController() {
    closeDeleteSubjectModal();
}


// ==========================================
// FILTRO DE TABLAS PARA ADMIN (ACADEMIC STRUCTURE)
// ==========================================
/* Filtrar tabla de asignaturas */
export function filterSubjectsTable(searchTerm) {
    filterSubjectsTableView(searchTerm);
}

/* Filtrar tabla de course offerings */
export function filterCourseOfferingsTable(searchTerm) {
    filterCourseOfferingsTableView(searchTerm);
}

/* Filtrar tabla de años académicos */
export function filterAcademicYearsTable(searchTerm) {
    filterAcademicYearsTableView(searchTerm);
}


// ==========================================
// MODAL CONFIRMAR ELIMINAR AÑO ACADÉMICO
// ==========================================

/* Abrir modal de confirmación para eliminar año académico */
export function openDeleteAcademicYearConfirmModal(yearId, yearName, offeringsCount) {
    renderDeleteAcademicYearConfirmModal(yearId, yearName, offeringsCount);
}

/* Cerrar modal de eliminación de año académico */
export function closeDeleteAcademicYearModalController() {
    closeDeleteAcademicYearModal();
}

/* Confirmar y ejecutar eliminación de año académico */
export async function confirmDeleteAcademicYear(yearId, yearName) {
    try {
        // Verificar nuevamente si tiene ofertas (doble seguridad)
        const offerings = await getAllCourseOfferings();
        const hasOfferings = offerings.some(o => o.academic_year_id === parseInt(yearId));
        
        if (hasOfferings) {
            showNotificationController(`Cannot delete ${yearName}: has course offerings linked`, "error");
            closeDeleteAcademicYearModal();
            return { success: false };
        }
        
        await deleteAcademicYear(yearId);
        
        showNotificationController(`Academic year ${yearName} deleted successfully`, "success");
        
        // Cerrar modal
        closeDeleteAcademicYearModal();
        
        // Recargar la vista
        await loadAcademicStructure();
        
        return { success: true };
        
    } catch (error) {
        console.error("Error deleting academic year:", error);
        showNotificationController(error.message || "Error deleting academic year", "error");
        closeDeleteAcademicYearModal();
        return { success: false, error: error.message };
    }
}

// ==========================================
// DELETE COURSE OFFERING MODAL CONTROLLERS
// ==========================================

/* Abrir modal de confirmación para eliminar course offering */
export function openDeleteCourseOfferingConfirmModal(offeringId, subjectName, academicYear) {
    renderDeleteCourseOfferingConfirmModal(offeringId, subjectName, academicYear);
}

/* Cerrar modal de eliminación de course offering */
export function closeDeleteCourseOfferingModalController() {
    closeDeleteCourseOfferingModal();
}

/* Confirmar y ejecutar eliminación de course offering */
export async function confirmDeleteCourseOffering(offeringId, subjectName, academicYear) {
    try {
        console.log("ENTRA AL CONTROLLER.js");
        await deleteCourseOffering(offeringId);
        
        showNotificationController(`Course offering "${subjectName}" (${academicYear}) deleted successfully`, "success");
        
        // Cerrar modal
        closeDeleteCourseOfferingModal();
        
        // Recargar la vista académica
        await loadAcademicStructure();
        
        return { success: true };
        
    } catch (error) {
        console.error("Error deleting course offering:", error);
        showNotificationController(error.message || "Error deleting course offering", "error");
        closeDeleteCourseOfferingModal();
        return { success: false, error: error.message };
    }
}

/* Abrir modal para editar course offering */
export async function openEditCourseOfferingModalController(offeringId, currentSubjectId, currentAcademicYearId) {
    try {
        // Recargar datos frescos para los selects
        await Promise.all([
            loadAllSubjectsForAdmin(),
            loadAllAcademicYearsForAdmin()
        ]);
        
        renderEditCourseOfferingModal(
            offeringId, 
            parseInt(currentSubjectId), 
            parseInt(currentAcademicYearId), 
            academicSubjectsData, 
            academicYearsData
        );
    } catch (error) {
        console.error("Error opening edit offering modal:", error);
        showNotificationController("Error loading edit form", "error");
    }
}

/* Editar course offering (llama al PATCH) */
export async function editCourseOfferingController(offeringId, subjectId, academicYearId) {
    try {
        if (!offeringId || !subjectId || !academicYearId) {
            showNotificationController("Faltan datos para actualizar", "error");
            return { success: false };
        }
        
        const updatedOffering = await updateCourseOffering(offeringId, {
            subject_id: parseInt(subjectId),
            academic_year_id: parseInt(academicYearId)
        });
        
        showNotificationController(`Oferta de curso actualizada exitosamente`, "success");
        
        // Recargar la vista de estructura académica
        await loadAcademicStructure();
        
        return { success: true, offering: updatedOffering };
    } catch (error) {
        console.error("Error editing course offering:", error);
        showNotificationController(error.message || "Error al actualizar oferta", "error");
        return { success: false, error: error.message };
    }
}

// ==========================================
// DUPLICATE COURSE OFFERING - ADMIN 
// ==========================================
// Estado para el modal de admin
let adminDuplicateState = {
    currentStep: 1,
    selectedOffering: null,
    targetYearId: null,
    targetYearName: null,
    offeringsByYear: {},
    allOfferings: []
};

/* Manejar selección de oferta (Admin) */
export function handleAdminDuplicateSelect(offeringId) {
    const selectedOffering = adminDuplicateState.allOfferings.find(o => o.id === offeringId);
    
    if (selectedOffering) {
        adminDuplicateState.selectedOffering = selectedOffering;
        
        // Actualizar UI
        updateAdminDuplicateModalUI({
            currentStep: adminDuplicateState.currentStep,
            selectedOffering: selectedOffering,
            targetYearId: adminDuplicateState.targetYearId,
            targetYearName: adminDuplicateState.targetYearName
        });
        
        // Marcar tarjeta como seleccionada
        document.querySelectorAll('.admin-duplicate-offering-card').forEach(card => {
            const cardId = parseInt(card.dataset.offeringId);
            if (cardId === offeringId) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }
}

/* Manejar cambio de año (Admin) - filtrar ofertas por año */
export function handleAdminDuplicateYearChange(year) {
    if (year === "all") {
        updateAdminOfferingsList(adminDuplicateState.allOfferings);
    } else if (adminDuplicateState.offeringsByYear[year]) {
        updateAdminOfferingsList(adminDuplicateState.offeringsByYear[year]);
    } else {
        updateAdminOfferingsList([]);
    }
    
    // Actualizar tabs visualmente
    document.querySelectorAll('.admin-duplicate-year-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.year === year) {
            tab.classList.add('active');
        }
    });
}

/* Manejar cambio de año destino */
export function handleAdminDuplicateTargetYearChange(targetYearId) {
    const selectElement = document.getElementById("adminTargetAcademicYearSelect");
    let targetYearName = "";
    
    if (targetYearId && targetYearId !== "") {
        const selectedOption = selectElement?.options[selectElement.selectedIndex];
        targetYearName = selectedOption?.text || "";
    }
    
    adminDuplicateState.targetYearId = targetYearId || null;
    adminDuplicateState.targetYearName = targetYearName;
    
    // Actualizar UI
    if (adminDuplicateState.currentStep === 1) {
        updateAdminStep1NextButton();
    } else if (adminDuplicateState.currentStep === 2) {
        updateAdminReviewSummary(targetYearName);
        updateAdminConfirmButtonState();
    }
}

/* Ir al siguiente paso */
export function adminDuplicateNextStep() {
    if (adminDuplicateState.currentStep === 1 && !adminDuplicateState.targetYearId) {
        showNotificationController("Por favor, selecciona un año académico destino", "warning");
        return;
    }
    
    if (adminDuplicateState.currentStep < 2) {
        adminDuplicateState.currentStep++;
        
        // Actualizar UI del paso 2 con el año seleccionado
        updateAdminReviewSummary(adminDuplicateState.targetYearName);
        updateAdminConfirmButtonState();
        
        // Mostrar el paso 2, ocultar paso 1
        const step1Content = document.getElementById("adminStep1Content");
        const step2Content = document.getElementById("adminStep2Content");
        const steps = document.querySelectorAll("#adminDuplicateModalOverlay .step");
        
        if (step1Content) step1Content.classList.remove("active");
        if (step2Content) step2Content.classList.add("active");
        
        steps.forEach((step, idx) => {
            if (idx === 0) {
                step.classList.remove("active");
                step.classList.add("completed");
            }
            if (idx === 1) {
                step.classList.add("active");
            }
        });
    }
}


/* Paso anterior (Admin) */
export function adminDuplicatePrevStep() {
    if (adminDuplicateState.currentStep > 1) {
        adminDuplicateState.currentStep--;
        
        // Mostrar paso 1, ocultar paso 2
        const step1Content = document.getElementById("adminStep1Content");
        const step2Content = document.getElementById("adminStep2Content");
        const steps = document.querySelectorAll("#adminDuplicateModalOverlay .step");
        
        if (step1Content) step1Content.classList.add("active");
        if (step2Content) step2Content.classList.remove("active");
        
        steps.forEach((step, idx) => {
            if (idx === 0) {
                step.classList.remove("completed");
                step.classList.add("active");
            }
            if (idx === 1) {
                step.classList.remove("active");
            }
        });
    }
}



/* Confirmar duplicación */
export async function confirmAdminDuplicateCourseOffering() {
    if (!adminDuplicateState.selectedOffering) {
        showNotificationController("No hay oferta seleccionada", "error");
        return;
    }
    
    if (!adminDuplicateState.targetYearId) {
        showNotificationController("No hay año destino seleccionado", "error");
        return;
    }
    
    try {
        setAdminConfirmButtonLoading(true);
        
        const result = await duplicateCourseOffering(
            adminDuplicateState.selectedOffering.id, 
            adminDuplicateState.targetYearId
        );
        
        showNotificationController(`Course offering duplicada exitosamente al año ${adminDuplicateState.targetYearName}`, "success");
        
        closeAdminDuplicateModal();
        await loadAcademicStructure(); // Recargar vista de admin
        
    } catch (error) {
        console.error("Error duplicating offering:", error);
        showNotificationController(error.message || "Error al duplicar la oferta", "error");
    } finally {
        setAdminConfirmButtonLoading(false);
    }
}


/* Cerrar modal */
export function closeAdminDuplicateModal() {
    closeAdminDuplicateModalView();
    adminDuplicateState = {
        currentStep: 1,
        selectedOffering: null,
        targetYearId: null,
        targetYearName: null
    };
}

/* Abrir modal de duplicación con una oferta preseleccionada */
export async function openAdminDuplicateCourseOfferingWithPreselection(offeringId, subjectName, academicYear) {
    try {
        // Obtener la oferta seleccionada
        const offerings = await getAllCourseOfferings();
        const academicYears = await getAcademicYears();
        const selectedOffering = offerings.find(o => o.id === parseInt(offeringId));
        
        if (!selectedOffering) {
            showNotificationController("No se encontró la oferta seleccionada", "error");
            return;
        }
        
        // Calcular estadísticas para la oferta seleccionada
        const exercises = await getExercisesByOffering(selectedOffering.id);
        
        let totalTestCases = 0;
        for (const ex of exercises) {
            const tcs = await getTestCaseByExercise(ex.id);
            totalTestCases += tcs?.length || 0;
        }
        
        let totalRubricCriteria = 0;
        for (const ex of exercises) {
            const rubric = await getRubricByExercise(ex.id);
            if (rubric && rubric.criteria) {
                totalRubricCriteria += Object.keys(rubric.criteria).length;
            }
        }
        
        let totalLanguages = 0;
        for (const ex of exercises) {
            const langs = await getLanguagesByExercise(ex.id);
            totalLanguages = Math.max(totalLanguages, langs?.length || 0);
        }
        
        // Enriquecer la oferta
        const enrichedOffering = {
            ...selectedOffering,
            subject_name: subjectName || selectedOffering.subject?.name || selectedOffering.subject_name,
            academic_year: academicYear || selectedOffering.academic_year,
            exercises_count: exercises.length,
            test_cases_count: totalTestCases,
            rubric_criteria_count: totalRubricCriteria,
            languages_count: totalLanguages
        };
        
        // Obtener años destino (todos excepto el año actual de la oferta)
        const sourceYearStart = parseInt(academicYear?.split('-')[0]) || 
                                (selectedOffering.academic_year ? parseInt(selectedOffering.academic_year.split('-')[0]) : null);
        
        const targetAcademicYears = academicYears.filter(year => {
            if (sourceYearStart && year.start_year === sourceYearStart) return false;
            return true;
        }).sort((a, b) => a.start_year - b.start_year);
        
        // Guardar estado
        adminDuplicateState = {
            currentStep: 1,
            selectedOffering: enrichedOffering,
            targetYearId: null,
            targetYearName: null
        };
        
        // Renderizar modal
        renderAdminDuplicateCourseOfferingModal(enrichedOffering, targetAcademicYears, null);
        
        // Configurar event listeners para el selector de año
        setTimeout(() => {
            const targetSelect = document.getElementById("adminTargetAcademicYearSelect");
            if (targetSelect) {
                targetSelect.addEventListener("change", (e) => {
                    handleAdminDuplicateTargetYearChange(e.target.value);
                });
            }
        }, 100);
        
    } catch (error) {
        console.error("Error opening admin duplicate modal:", error);
        showNotificationController("Error al cargar el modal de duplicación", "error");
    }
}



/* ==========================================
   USER MANAGEMENT - ADMIN
========================================== */

/* Estado global para gestión de usuarios */
let currentUsersData = [];
let currentUserSearchTerm = "";

/* Cargar página de gestión de usuarios */
export async function loadUserManagement() {
    try {
        const rol = localStorage.getItem("rol");
        if (rol !== "admin") {
            showNotificationController("No tienes permiso para acceder a esta sección", "error");
            loadDashboard();
            return;
        }
        
        const [users, roleCounts] = await Promise.all([
            getAllUsers(),
            getUsersByRoleCount()
        ]);
        
        const enrichedUsers = await enrichUsersWithSessionsCount(users);
        
        // Renderizar UI completa (estadísticas y tabla)
        renderUserManagement(enrichedUsers, roleCounts);
        setActiveMenu(6);
        
        // Guardar datos y aplicar filtros (resetea)
        setUsersData(enrichedUsers);
        
    } catch (error) {
        console.error("Error loading user management:", error);
        showNotificationController(error.message || "Error al cargar usuarios", "error");
    }
}
// Función auxiliar para filtrar usuarios por inicio de palabra
function filterUsersBySearchTerm(users, searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") return users;
    const searchLower = searchTerm.trim().toLowerCase();
    return users.filter(user => {
        const name = (user.name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const nameParts = name.split(/\s+/);
        const nameMatches = nameParts.some(part => part.startsWith(searchLower));
        const emailMatches = email.startsWith(searchLower);
        return nameMatches || emailMatches;
    });
}

// Controlador de búsqueda (se llama desde main.js al escribir en el input)
export async function searchUsersController(searchTerm) {
    // Guardar el término exacto
    currentUserSearchTerm = searchTerm ? searchTerm.trim() : "";
    // Obtener TODOS los usuarios
    const users = await getAllUsers();
    const enrichedUsers = await enrichUsersWithSessionsCount(users);
    currentUsersData = enrichedUsers;
    // Aplicar filtros (búsqueda, rol, estado)
    applyUserFilters();
}

// Aplicar to
/* Filtrar usuarios por rol */
export function filterUsersByRoleController(role) {
    if (!role || role === "") {
        renderUsersTable(currentUsersData, currentUsersData.length);
        return;
    }
    
    const filtered = currentUsersData.filter(user => user.role === role);
    renderUsersTable(filtered, filtered.length);
}


/* Abrir modal para crear usuario */
export async function openCreateUserModalController() {
    renderCreateUserModal();
}

/* Crear usuario */
export async function createUserController(email, name, password, role, stayInDashboard = false) {
    try {
        if (!email || !email.trim()) throw new Error("El email es requerido");
        if (!name || !name.trim()) throw new Error("El nombre es requerido");
        
        const MIN_PASSWORD_LENGTH = 8;
        if (!password || password.trim().length < MIN_PASSWORD_LENGTH) {
            throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
        }
        if (!role) throw new Error("El rol es requerido");
        
        const newUser = await createUser(email.trim(), name.trim(), password, role);
        showNotificationController(`Usuario ${name} creado exitosamente`, "success");
        
        // Recargar lista de usuarios (actualizar caché)
        const users = await getAllUsers();
        const enrichedUsers = await enrichUsersWithSessionsCount(users);  // ← importante para mantener sesiones
        const roleCounts = await getUsersByRoleCount();
        currentUsersData = enrichedUsers;
        
        if (!stayInDashboard) {
            // Modo normal: mostrar vista de Users
            renderUserManagement(enrichedUsers, roleCounts);
            setActiveMenu(6);
        } else {
            // Modo dashboard: solo actualizar el contador de usuarios en el dashboard
            const totalUsers = enrichedUsers.length;
            const totalStatElement = document.querySelector(".stat-card:first-child .stat-number");
            if (totalStatElement) {
                totalStatElement.textContent = totalUsers;
            }
            // Opcional: si el dashboard tiene más estadísticas, actualízalas aquí
        }
        
        return { success: true, user: newUser };
    } catch (error) {
        console.error("Error creating user:", error);
        const errorMsg = error.message || "Error al crear usuario";
        showNotificationController(errorMsg, "error");
        return { success: false, error: errorMsg };
    }
}

/* Abrir modal para editar usuario */
export async function openEditUserModalController(userId) {
    try {
        const user = await getUserById(userId);
        renderEditUserModal(user);
    } catch (error) {
        console.error("Error loading user for edit:", error);
        showNotificationController("Error al cargar datos del usuario", "error");
    }
}

/* Actualizar usuario */
export async function updateUserController(userId, name, email, role) {
    try {
        if (!name || !name.trim()) throw new Error("El nombre es requerido");
        // Nota: ya no validamos email porque no se puede cambiar, pero el parámetro llega igual
        if (!role) throw new Error("El rol es requerido");
        
        const updateData = { name: name.trim(), role: role };
        // Si el backend permite cambiar email, habría que incluirlo, pero no es el caso
        // const updateData = { name: name.trim(), email: email.trim(), role: role };
        const updatedUser = await updateUser(userId, updateData);
        
        showNotificationController(`Usuario ${name} actualizado exitosamente`, "success");
        
        // Recargar lista de usuarios ENRIQUECIDA con sesiones
        const users = await getAllUsers();
        const enrichedUsers = await enrichUsersWithSessionsCount(users);
        const roleCounts = await getUsersByRoleCount();
        
        currentUsersData = enrichedUsers;
        renderUserManagement(enrichedUsers, roleCounts);
        
        // Aplicar filtros actuales (por si hay alguno activo)
        applyUserFilters();
        
        return { success: true, user: updatedUser };
    } catch (error) {
        console.error("Error updating user:", error);
        showNotificationController(error.message || "Error al actualizar usuario", "error");
        return { success: false, error: error.message };
    }
}

/* Abrir modal para eliminar usuario */
export function openDeleteUserModalController(userId, userName) {
    renderDeleteUserConfirmModal(userId, userName);
}

/* Eliminar usuario */
export async function deleteUserController(userId, userName) {
   try {
        await deleteUser(userId);
        showNotificationController(`Usuario ${userName} eliminado exitosamente`, "success");

        const users = await getAllUsers();
        const enrichedUsers = await enrichUsersWithSessionsCount(users);
        const roleCounts = await getUsersByRoleCount();
        currentUsersData = enrichedUsers;
        renderUserManagement(enrichedUsers, roleCounts);
        applyUserFilters();

        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        showNotificationController(error.message || "Error al eliminar usuario", "error");
        return { success: false, error: error.message };
    }
}

/* Forzar cambio de contraseña */
export async function forceUserPasswordChangeController(userId, userName) {
    try {
        await forcePasswordChange(userId);
        
        showNotificationController(`Se ha forzado a ${userName} a cambiar su contraseña en el próximo inicio de sesión`, "success");
        
        // Recargar lista de usuarios enriquecida
        const users = await getAllUsers();
        const enrichedUsers = await enrichUsersWithSessionsCount(users);
        const roleCounts = await getUsersByRoleCount();
        currentUsersData = enrichedUsers;
        renderUserManagement(enrichedUsers, roleCounts);
        applyUserFilters(); // para respetar filtros activos
        
        return { success: true };
    } catch (error) {
        console.error("Error forcing password change:", error);
        showNotificationController(error.message || "Error al forzar cambio de contraseña", "error");
        return { success: false, error: error.message };
    }
}

/* Cambiar rol de usuario */
export async function changeUserRoleController(userId, newRole, userName) {
    try {
        await changeUserRole(userId, newRole);
        
        showNotificationController(`Rol de ${userName} cambiado a ${newRole}`, "success");
        
        // Recargar lista
        const users = await getAllUsers();
        const roleCounts = await getUsersByRoleCount();
        currentUsersData = users;
        renderUserManagement(users, roleCounts);
        
        return { success: true };
    } catch (error) {
        console.error("Error changing user role:", error);
        showNotificationController(error.message || "Error al cambiar rol", "error");
        return { success: false, error: error.message };
    }
}

/* Abrir modal de sesiones */
export async function openUserSessionsModalController(userId, userName) {
    try {
        const sessions = await getUserSessions(userId);
        renderUserSessionsModal(userId, userName, sessions);
    } catch (error) {
        console.error("Error loading user sessions:", error);
        showNotificationController("Error al cargar sesiones del usuario", "error");
    }
}

/* Revocar una sesión específica */
export async function revokeSessionController(userId, sessionId) {
    try {
        await revokeUserSession(userId, sessionId);
        
        showNotificationController("Sesión revocada exitosamente", "success");
        
        // Recargar el modal de sesiones si está abierto
        const user = await getUserById(userId);
        const sessions = await getUserSessions(userId);
        updateUserSessionsModal(sessions);
        
        return { success: true };
    } catch (error) {
        console.error("Error revoking session:", error);
        showNotificationController(error.message || "Error al revocar sesión", "error");
        return { success: false, error: error.message };
    }
}

/* Revocar todas las sesiones de un usuario */
export async function revokeAllSessionsController(userId, userName) {
    try {
        await revokeAllUserSessions(userId);
        
        showNotificationController(`Todas las sesiones de ${userName} han sido revocadas`, "success");
        
        // Recargar el modal de sesiones si está abierto
        const sessions = await getUserSessions(userId);
        updateUserSessionsModal(sessions);
        
        return { success: true };
    } catch (error) {
        console.error("Error revoking all sessions:", error);
        showNotificationController(error.message || "Error al revocar sesiones", "error");
        return { success: false, error: error.message };
    }
}

/* Subir usuarios desde Excel */
export async function uploadUsersExcelController(file) {
    try {
        if (!file) {
            showNotificationController("Selecciona un archivo Excel", "error");
            return { success: false };
        }
        
        // 1. Subir el archivo y obtener resultado del backend
        const result = await uploadUsersExcel(file);
        
        const successCount = result.created_count || 0;
        const errors = result.errors || [];
        
        // 2. Mostrar notificaciones detalladas
        if (successCount > 0) {
            if (errors.length > 0) {
                // Resumen de errores (primeros 3 para no saturar)
                const errorSummary = errors.slice(0, 3).map(e => 
                    `Fila ${e.row}: ${e.detail || e.errors || 'Error desconocido'}`
                ).join('; ');
                const more = errors.length > 3 ? ` y ${errors.length - 3} más.` : '';
                showNotificationController(
                    `${successCount} usuarios creados. ${errors.length} errores: ${errorSummary}${more}`, 
                    "warning"
                );
            } else {
                showNotificationController(`${successCount} usuarios creados correctamente`, "success");
            }
        } else if (errors.length > 0) {
            // No se creó ninguno, mostrar todos los errores
            const errorDetails = errors.map(e => 
                `Fila ${e.row}: ${e.detail || e.errors || 'Error desconocido'}`
            ).join('; ');
            showNotificationController(`No se pudo crear ningún usuario. Errores: ${errorDetails}`, "error");
        } else {
            // Sin errores pero 0 creados (archivo vacío o sin datos válidos)
            showNotificationController("No se encontraron datos válidos en el archivo. Verifica el formato.", "warning");
        }
        
        // 3. Recargar la lista completa de usuarios ENRIQUECIDA con sesiones
        const users = await getAllUsers();
        const enrichedUsers = await enrichUsersWithSessionsCount(users);
        const roleCounts = await getUsersByRoleCount();
        
        // 4. Actualizar estado global y vista
        currentUsersData = enrichedUsers;
        renderUserManagement(enrichedUsers, roleCounts);
        
        // 5. Aplicar los filtros actuales (por si están activos)
        applyUserFilters();
        
        return result;
    } catch (error) {
        console.error("Error uploading users excel:", error);
        showNotificationController(error.message || "Error al subir el archivo", "error");
        return { success: false, error: error.message };
    }
}

/* Descargar plantilla de usuarios */
export async function downloadUsersTemplateController() {
    try {
        const blob = await downloadUsersTemplate();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plantilla_usuarios.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showNotificationController("Plantilla descargada correctamente", "success");
    } catch (error) {
        console.error("Error downloading template:", error);
        showNotificationController("Error al descargar la plantilla", "error");
    }
}

/* Cerrar modal de usuario */
export function closeUserModal() {
    removeExistingUserModal();
}


async function enrichUsersWithSessionsCount(users) {
    if (!users || users.length === 0) return users;
    
    const enrichedUsers = [];
    for (const user of users) {
        try {
            const sessions = await getUserSessions(user.id);
            user.active_sessions = sessions.length;
        } catch (error) {
            console.log(`Could not fetch sessions for user ${user.id}:`, error);
            user.active_sessions = 0;
        }
        enrichedUsers.push(user);
    }
    return enrichedUsers;
}



let currentRoleFilter = "";
let currentStatusFilter = "";
/* Actualizar la tabla con los filtros actuales */
export function applyUserFilters() {
    if (!currentUsersData.length) return;
    let filtered = [...currentUsersData];
    // 1. Filtrar por búsqueda (si hay término)
    if (currentUserSearchTerm && currentUserSearchTerm !== "") {
        filtered = filterUsersBySearchTerm(filtered, currentUserSearchTerm);
    }
    // 2. Filtrar por rol
    if (currentRoleFilter === "norole") {
        filtered = filtered.filter(user => !user.role);
    } else if (currentRoleFilter) {
        filtered = filtered.filter(user => user.role === currentRoleFilter);
    }
    // 3. Filtrar por estado (activo/inactivo)
    if (currentStatusFilter === "active") {
        filtered = filtered.filter(user => user.active_sessions > 0);
    } else if (currentStatusFilter === "inactive") {
        filtered = filtered.filter(user => user.active_sessions === 0);
    }
    // Renderizar la tabla con los usuarios filtrados (ya enriquecidos)
    renderUsersTable(filtered, filtered.length);
}

/* Cambiar filtro por rol */
export function setRoleFilter(role) {
    currentRoleFilter = role === "" ? "" : role;
    highlightActiveRoleFilter(currentRoleFilter);
    applyUserFilters();
}

/* Cambiar filtro por estado */
export function setStatusFilter(status) {
    currentStatusFilter = status;
    highlightActiveStatusFilter(currentStatusFilter);
    applyUserFilters();
}

/* Establecer los datos originales (se llama tras cargar) */
export function setUsersData(users) {
    currentUsersData = users;
    // Resetear filtros
    currentRoleFilter = "";
    currentStatusFilter = "";
    highlightActiveRoleFilter("");
    highlightActiveStatusFilter("");
    applyUserFilters();
}

/* Actualizar los labels de los botones de filtro */
function updateFilterLabels() {
    const roleFilterBtn = document.getElementById("roleFilterBtn");
    const statusFilterBtn = document.getElementById("statusFilterBtn");
    
    if (roleFilterBtn) {
        let label = "All Roles";
        if (currentRoleFilter === "admin") label = "Admin";
        else if (currentRoleFilter === "teacher") label = "Professor";
        else if (currentRoleFilter === "student") label = "Student";
        roleFilterBtn.innerHTML = `${label} <span class="filter-arrow">▼</span>`;
    }
    
    if (statusFilterBtn) {
        let label = "All Status";
        if (currentStatusFilter === "active") label = "Active";
        else if (currentStatusFilter === "inactive") label = "Inactive";
        statusFilterBtn.innerHTML = `${label} <span class="filter-arrow">▼</span>`;
    }
}

/* Limpiar todos los filtros (opcional) */
export function clearUserFilters() {
    currentRoleFilter = "";
    currentStatusFilter = "";
    updateFilterLabels();
    
    if (currentUsersData.length) {
        renderUsersTable(currentUsersData, currentUsersData.length);
    }
}


// Abrir modal de forzar cambio de contraseña
export function openForcePasswordModalController(userId, userName) {
    renderForcePasswordChangeModal(userId, userName);
}

// Confirmar y ejecutar forzar cambio de contraseña
export async function confirmForcePasswordController(userId, userName) {
    try {
        await forcePasswordChange(userId);  // función del model
        
        showNotificationController(`Se ha forzado a ${userName} a cambiar su contraseña en el próximo inicio de sesión`, "success");
        
        // Recargar lista de usuarios enriquecida
        const users = await getAllUsers();
        const enrichedUsers = await enrichUsersWithSessionsCount(users);
        const roleCounts = await getUsersByRoleCount();
        currentUsersData = enrichedUsers;
        renderUserManagement(enrichedUsers, roleCounts);
        applyUserFilters(); // respetar filtros activos
        
        // Cerrar modal (llamando a view)
        closeForcePasswordModal();
        
        return { success: true };
    } catch (error) {
        console.error("Error forcing password change:", error);
        showNotificationController(error.message || "Error al forzar cambio de contraseña", "error");
        closeForcePasswordModal(); // también cerrar en caso de error
        return { success: false, error: error.message };
    }
}

export function closeForcePasswordModalController() {
    closeForcePasswordModal(); 
}


// ==========================================
// FORGOT PASSWORD
// ==========================================
export async function forgotPasswordController(email) {
    try {
        console.log(email);
        const result = await forgotPassword(email);
        showNotificationController("Si el email existe, recibirás un enlace para restablecer tu contraseña.", "success");
        return { success: true, data: result };
    } catch (error) {
        console.error("Error en forgot password:", error);
        showNotificationController(error.message, "error");
        return { success: false, error: error.message };
    }
}

// ==========================================
// RESET PASSWORD
// ==========================================
export async function resetPasswordController(token, newPassword) {
    try {
        const result = await resetPassword(token, newPassword);
        showNotificationController("Contraseña restablecida correctamente. Ya puedes iniciar sesión.", "success");
        return { success: true, data: result };
    } catch (error) {
        console.error("Error en reset password:", error);
        showNotificationController(error.message, "error");
        return { success: false, error: error.message };
    }
}

// ==========================================
// CAMBIAR CONTRASEÑA DESDE PERFIL (con verificación)
// ==========================================
export async function changeMyPasswordWithVerificationController(currentPassword, newPassword) {
    try {
        const result = await changeMyPasswordWithVerification(currentPassword, newPassword);
        showNotificationController("Contraseña actualizada correctamente", "success");
        // Recargar perfil para actualizar la fecha de último cambio (si el backend la devuelve)
        await loadMyProfile();
        return { success: true, data: result };
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        showNotificationController(error.message, "error");
        return { success: false, error: error.message };
    }
}


/* Abrir modal de cambio de contraseña */
export function openChangePasswordModalController() {
    renderChangePasswordModal();
}

/* Cerrar modal de cambio de contraseña */
export function closeChangePasswordModalController() {
    closeChangePasswordModal();
}

/* Confirmar cambio de contraseña (lógica + cierre + recarga) */
export async function confirmChangePasswordController(currentPassword, newPassword) {
    try {
        const result = await changeMyPasswordWithVerification(currentPassword, newPassword);
        showNotificationController("Contraseña actualizada correctamente", "success");
        // Cerrar modal
        closeChangePasswordModal();
        // Recargar perfil para actualizar la fecha
        await loadMyProfile();
        return { success: true };
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        showNotificationController(error.message, "error");
        return { success: false, error: error.message };
    }
}

function groupAndSortExercises(exercises) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const active = [];
    const noDeadline = [];
    const closed = [];

    for (const ex of exercises) {
        if (!ex.deadline || ex.deadline === "null") {
            noDeadline.push(ex);
        } else {
            const deadlineDate = new Date(ex.deadline);
            if (deadlineDate < now) {
                closed.push(ex);
            } else {
                active.push(ex);
            }
        }
    }

    // Ordenar activos por fecha ascendente (más cercano primero)
    active.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Opcional: ordenar cerrados por fecha descendente (más reciente cerrado primero)
    closed.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

    // Concatenar: activos → sin deadline → cerrados
    return [...active, ...noDeadline, ...closed];
}


// REPORTES ADMIN
export async function getAdminReportData() {
    try {
        const offerings = await getAllCourseOfferings();
        const subjects = await getAllSubjects();
        const academicYears = await getAcademicYears();
        
        const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
        const yearMap = new Map(academicYears.map(y => [y.id, `${y.start_year}-${y.end_year}`]));
        
        const reportData = [];
        
        for (const offering of offerings) {
            const subjectName = subjectMap.get(offering.subject_id) || `Course ${offering.id}`;
            const academicYear = yearMap.get(offering.academic_year_id) || offering.academic_year || "Unknown";
            const courseLabel = `${subjectName} (${academicYear})`;
            
            const students = await getStudentsByCourseOffering(offering.id);
            const totalStudents = students.length;
            
            // Saltar cursos sin estudiantes
            if (totalStudents === 0) {
                continue;
            }
            
            const exercises = await getExercisesByOffering(offering.id);
            let allSubmissions = [];
            for (const ex of exercises) {
                const subs = await getSubmissionsByExercise(ex.id);
                allSubmissions = [...allSubmissions, ...subs];
            }
            
            // Saltar cursos sin submissions
            if (allSubmissions.length === 0) {
                continue;
            }
            
            // Verificar si al menos una submission tiene evaluación
            let hasEvaluation = false;
            for (const sub of allSubmissions) {
                try {
                    const ev = await getEvaluationBySubmission(sub.id);
                    if (ev && ev.score !== undefined) {
                        hasEvaluation = true;
                        break;
                    }
                } catch (err) {}
            }
            if (!hasEvaluation) {
                continue; // Saltar cursos sin evaluaciones completadas
            }
            
            const result = await getCoursePassData(allSubmissions);
            const passRate = totalStudents > 0 ? (result.totalPassed / totalStudents) * 100 : 0;

            reportData.push({
                course: courseLabel,
                totalStudents: totalStudents,
                totalSubmissions: allSubmissions.length,
                totalPassed: result.totalPassed,
                passRate: Number(passRate.toFixed(2)),
                averageGrade: result.averageGrade
            });
        }
        
        reportData.sort((a, b) => a.course.localeCompare(b.course));
        
        return reportData;
    } catch (error) {
        console.error("Error getting admin report data:", error);
        return [];
    }
}

// ==========================================
// SYSTEM CONFIG (SERVICES)
// ==========================================

export async function loadSystemConfig() {
    try {
        const rol = localStorage.getItem("rol");
        if (rol !== "admin") {
            showNotificationController("No tienes permiso para acceder a esta sección", "error");
            loadDashboard();
            return;
        }

        const services = await getSystemServices();
        // Llamar a la vista que solo muestra servicios (sin logs)
        renderSystemServices(services);   // ← importante: usar renderSystemServices, no renderSystemConfig
        setActiveMenu(7);
    } catch (error) {
        console.error("Error loading system config:", error);
        showNotificationController(error.message || "Error al cargar la configuración", "error");
    }
}
