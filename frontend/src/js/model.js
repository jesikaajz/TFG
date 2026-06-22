const API_URL = "http://localhost:8000";

function parseJwt(token) {
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Error parsing JWT:", e);
        return null;
    }
}

async function refreshToken() {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) throw new Error("No refresh token");

    const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh_token: refresh })
    });

    if (!res.ok) {
        throw new Error("Refresh token inválido");
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data;
}

let refreshPromise = null;

async function apiFetch(url, options = {}, retry = false) {
    let token = localStorage.getItem("access_token");
    let res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
            "Authorization": `Bearer ${token}`
        }
    });

    if (res.status === 401 && !retry) {
        try {
            // Si ya hay un refresh en curso, esperar a que termine
            if (!refreshPromise) {
                refreshPromise = refreshToken().finally(() => {
                    refreshPromise = null;
                });
            }
            await refreshPromise;
            // Reintentar la petición original con el nuevo token
            return await apiFetch(url, options, true);
        } catch (error) {
            localStorage.clear();
            window.location.href = "/login.html";
            throw error;
        }
    }
    return res;
}
// ==========================================
// AUTENTICACIÓN
// ==========================================
function getDeviceId() {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
        // Generar ID único para este navegador/dispositivo
        deviceId = crypto.randomUUID ? crypto.randomUUID() : 
                   'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                       const r = Math.random() * 16 | 0;
                       const v = c === 'x' ? r : (r & 0x3 | 0x8);
                       return v.toString(16);
                   });
        localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
}

/* LOGIN - Para usuarios normales (con contraseña definitiva) */
export async function loginUser(email, password, rol) {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                 "X-Device-ID": getDeviceId()
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Credenciales incorrectas");
        }

        const data = await response.json();
        const decoded = parseJwt(data.access_token);
        const rolUsuario = decoded.role;

        if (rolUsuario !== rol) {
            throw new Error("Rol incorrecto");
        }

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("rol", rolUsuario);
        localStorage.setItem("password_change_required", data.password_change_required || false);

        return data;

    } catch (error) {
        console.error("Error login:", error);
        throw error;
    }
}

/* LOGIN TEMPORAL - Para usuarios con contraseña temporal (importados por Excel) */
export async function loginTempUser(email, password, rol) {
    try {
        const response = await fetch(`${API_URL}/auth/login-temp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 403 && error.detail && error.detail.includes("only for users")) {
                throw new Error("Esta cuenta no requiere cambio de contraseña. Usa el login normal.");
            }
            throw new Error(error.detail || "Credenciales incorrectas");
        }

        const data = await response.json();
        const decoded = parseJwt(data.access_token);
        const rolUsuario = decoded.role;

        if (rolUsuario !== rol) {
            throw new Error("Rol incorrecto");
        }

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("rol", rolUsuario);
        localStorage.setItem("password_change_required", data.password_change_required || true);

        return data;

    } catch (error) {
        console.error("Error login temp:", error);
        throw error;
    }
}

/* REGISTRO PÚBLICO */
export async function registerUser(nombre, email, password) {
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: nombre,
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Error al registrar");
        }

        return await response.json();

    } catch (error) {
        console.error("Error register:", error);
        throw error;
    }
}

/* CAMBIAR CONTRASEÑA PROPIA */
export async function changeMyPassword(newPassword) {
    const response = await apiFetch(`${API_URL}/users/me/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al cambiar contraseña");
    }

    localStorage.setItem("password_change_required", "false");
    return await response.json();
}

/* VERIFICAR TOKEN */
export async function verifyToken() {
    const response = await apiFetch(`${API_URL}/auth/verify`);
    if (!response.ok) return null;
    return await response.json();
}

/* LOGOUT */
export async function logout() {
    const refresh_token = localStorage.getItem("refresh_token");
    if (refresh_token) {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token })
            });
        } catch (e) {
            console.error("Error en logout:", e);
        }
    }
    localStorage.clear();
}

// ==========================================
// USUARIOS
// ==========================================

/* Obtener todos los usuarios (solo admin) */
export async function getAllUsers() {
    const response = await apiFetch(`${API_URL}/users/`);
    if (!response.ok) throw new Error("Error al obtener usuarios");
    return await response.json();
}

/* Obtener usuarios pendientes (sin rol) */
export async function getPendingUsers() {
    const response = await apiFetch(`${API_URL}/users/pending`);
    if (!response.ok) throw new Error("Error al obtener usuarios pendientes");
    return await response.json();
}

/* Actualizar mi propio perfil (PATCH /users/{user_id}) */
export async function updateMyProfile(userId, data) {
    const response = await apiFetch(`${API_URL}/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Error al actualizar perfil");
    return await response.json();
}

/* Asignar rol a usuario */
export async function assignRole(userId, role) {
    const response = await apiFetch(`${API_URL}/users/${userId}/assign-role?role=${role}`, {
        method: "PUT"
    });
    if (!response.ok) throw new Error("Error al asignar rol");
    return await response.json();
}

/* Cambiar rol de usuario */
export async function changeUserRole(userId, role) {
    const response = await apiFetch(`${API_URL}/users/${userId}/role?role=${role}`, {
        method: "PUT"
    });
    if (!response.ok) throw new Error("Error al cambiar rol");
    return await response.json();
}

/* Obtener todos los estudiantes */
export async function getAllStudents() {
    const response = await apiFetch(`${API_URL}/users/students`);
    if (!response.ok) throw new Error("Error al obtener estudiantes");
    return await response.json();
}

/* Obtener todos los profesores */
export async function getAllTeachers() {
    const response = await apiFetch(`${API_URL}/users/teachers`);
    if (!response.ok) throw new Error("Error al obtener profesores");
    return await response.json();
}

/* Obtener usuario por ID */
export async function getUserById(userId) {
    const response = await apiFetch(`${API_URL}/users/${userId}`);
    if (!response.ok) throw new Error("Error al obtener usuario");
    return await response.json();
}

/* Obtener perfil propio */
export async function getMyProfile() {
    const response = await apiFetch(`${API_URL}/users/me`);
    if (!response.ok) throw new Error("Error al obtener perfil");
    return await response.json();
}

/* Contar usuarios (solo admin) */
export async function getCountAllUsers() {
    const response = await apiFetch(`${API_URL}/users/users/count`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count;
}

/* Crear usuario (admin) */
export async function createUser(email, name, password, role) {
    const response = await apiFetch(`${API_URL}/users/`, {
        method: "POST",
        body: JSON.stringify({ email, name, password, role })
    });
    if (!response.ok) throw new Error("Error al crear usuario");
    return await response.json();
}

/* Eliminar usuario */
export async function deleteUser(userId) {
    const response = await apiFetch(`${API_URL}/users/${userId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar usuario");
    return await response.json();
}

/* Subir usuarios por Excel */
export async function uploadUsersExcel(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/users/upload`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) throw new Error("Error al subir archivo");
    return await response.json();
}

/* Descargar plantilla de usuarios */
export async function downloadUsersTemplate() {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/users/template`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Error al descargar plantilla");
    return await response.blob();
}

/* Actualizar usuario (nombre, email, rol) */
export async function updateUser(userId, userData) {
    const response = await apiFetch(`${API_URL}/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error("Error al actualizar usuario");
    return await response.json();
}


/* Forzar cambio de contraseña a un usuario (admin) */
export async function forcePasswordChange(userId) {
    const response = await apiFetch(`${API_URL}/users/${userId}/force-password-change`, {
        method: "PATCH"   
    });
    if (!response.ok) throw new Error("Error al forzar cambio de contraseña");
    return await response.json();
}


/* Buscar usuarios por término (admin) */
/*export async function searchUsers(searchTerm) {
    const response = await apiFetch(`${API_URL}/users/users/search?q=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) throw new Error("Error al buscar usuarios");
    return await response.json();
}*/


// ==========================================
// ASIGNATURAS (SUBJECTS)
// ==========================================

/* Obtener todas las asignaturas */
export async function getAllSubjects() {
    const response = await apiFetch(`${API_URL}/courses/subjects/`);
    if (!response.ok) throw new Error("Error al obtener asignaturas");
    return await response.json();
}

/* Crear asignatura (admin) */
export async function createSubject(name, description) {
    const response = await apiFetch(`${API_URL}/courses/subjects/`, {
        method: "POST",
        body: JSON.stringify({ name, description })
    });
    if (!response.ok) throw new Error("Error al crear asignatura");
    return await response.json();
}

/* Actualizar asignatura */
export async function updateSubject(subjectId, data) {
    const response = await apiFetch(`${API_URL}/courses/subjects/${subjectId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Error al actualizar asignatura");
    return await response.json();
}

/* Eliminar asignatura */
export async function deleteSubject(subjectId) {
    const response = await apiFetch(`${API_URL}/courses/subjects/${subjectId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar asignatura");
    return await response.json();
}

/* Contar asignaturas */
export async function getCountAllSubjects() {
    const response = await apiFetch(`${API_URL}/courses/subjects/subjects/count`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count;
}

/* Subir asignaturas por Excel */
export async function uploadSubjectsExcel(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/courses/subjects/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    if (!response.ok) throw new Error("Error al subir archivo");
    return await response.json();
}

/* Descargar plantilla de asignaturas */
export async function downloadSubjectsTemplate() {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/courses/subjects/template`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Error al descargar plantilla");
    return await response.blob();
}

// ==========================================
// AÑOS ACADÉMICOS
// ==========================================

/* Obtener todos los años académicos */
export async function getAcademicYears() {
    const response = await apiFetch(`${API_URL}/academic-years/academic-years/`);
    if (!response.ok) throw new Error("Error al obtener años académicos");
    return await response.json();
}

/* Crear año académico */
export async function createAcademicYear(startYear, endYear) {
    const response = await apiFetch(`${API_URL}/academic-years/academic-years/`, {
        method: "POST",
        body: JSON.stringify({ start_year: startYear, end_year: endYear })
    });
    if (!response.ok) throw new Error("Error al crear año académico");
    return await response.json();
}

/* Actualizar año académico */
export async function updateAcademicYear(yearId, startYear, endYear) {
    const response = await apiFetch(`${API_URL}/academic-years/academic-years/${yearId}`, {
        method: "PUT",
        body: JSON.stringify({ start_year: startYear, end_year: endYear })
    });
    if (!response.ok) throw new Error("Error al actualizar año académico");
    return await response.json();
}

/* Eliminar año académico */
export async function deleteAcademicYear(yearId) {
    const response = await apiFetch(`${API_URL}/academic-years/academic-years/${yearId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar año académico");
    return await response.json();
}

// ==========================================
// OFERTAS DE CURSOS (COURSE OFFERINGS)
// ==========================================

/* Obtener todas las ofertas */
export async function getAllCourseOfferings() {
    const response = await apiFetch(`${API_URL}/course-offerings/course-offerings/`);
    if (!response.ok) throw new Error("Error al obtener ofertas");
    return await response.json();
}

/* Crear oferta */
export async function createCourseOffering(subjectId, academicYearId) {
    const response = await apiFetch(`${API_URL}/course-offerings/course-offerings/`, {
        method: "POST",
        body: JSON.stringify({ subject_id: subjectId, academic_year_id: academicYearId })
    });
    if (!response.ok) throw new Error("Error al crear oferta");
    return await response.json();
}

/* Eliminar oferta */
export async function deleteCourseOffering(offeringId) {
    const response = await apiFetch(`${API_URL}/course-offerings/course-offerings/${offeringId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar oferta");
    return await response.json();
}

/* Subir ofertas por Excel */
export async function uploadCourseOfferingsExcel(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/course-offerings/course-offerings/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    if (!response.ok) throw new Error("Error al subir archivo");
    return await response.json();
}

/* Descargar plantilla de ofertas */
export async function downloadCourseOfferingsTemplate() {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/course-offerings/course-offerings/template`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Error al descargar plantilla");
    return await response.blob();
}

/* Obtener las materias que el profesor imparte en un año específico */
export async function getMySubjectsByAcademicYear(academicYearId) {
    const response = await apiFetch(`${API_URL}/course-offerings/course-offerings/my-subjects/${academicYearId}`);
    if (!response.ok) throw new Error("Error al obtener materias del año");
    return await response.json();
}

/* Buscar course offerings por filtros (admin) */
export async function searchCourseOfferings(params) {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiFetch(`${API_URL}/course-offerings/course-offerings/search?${queryString}`);
    if (!response.ok) throw new Error("Error al buscar ofertas");
    return await response.json();
}
export async function updateCourseOffering(offeringId, data) {
    const response = await apiFetch(`${API_URL}/course-offerings/course-offerings/${offeringId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        let errorDetail = "Error al actualizar la oferta";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}


// ==========================================
// ASIGNACIONES DE PROFESORES
// ==========================================

/* Obtener todas las asignaciones */
export async function getAllTeacherAssignments() {
    const response = await apiFetch(`${API_URL}/teacher-assignments/teacher-assignments/`);
    if (!response.ok) throw new Error("Error al obtener asignaciones");
    return await response.json();
}

/* Crear asignación */
export async function createTeacherAssignment(professorId, courseOfferingId) {
    console.log(professorId);
    console.log(courseOfferingId);
    const response = await apiFetch(`${API_URL}/teacher-assignments/teacher-assignments/`, {
        method: "POST",
        body: JSON.stringify({ professor_id: professorId, course_offering_id: courseOfferingId })
    });
    if (!response.ok) throw new Error("Error al crear asignación");
    return await response.json();
}

/* Eliminar asignación */
export async function deleteTeacherAssignment(assignmentId) {
    const response = await apiFetch(`${API_URL}/teacher-assignments/teacher-assignments/${assignmentId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar asignación");
    return await response.json();
}

/* Subir asignaciones por Excel */
export async function uploadTeacherAssignmentsExcel(file) {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/teacher-assignments/teacher-assignments/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });
    if (!response.ok) {
        let errorDetail = "Error al subir archivo";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}

/* Descargar plantilla de asignaciones */
export async function downloadTeacherAssignmentsTemplate() {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/teacher-assignments/teacher-assignments/template`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Error al descargar plantilla");
    return await response.blob();
}

/* Crear múltiples asignaciones de profesores (bulk) */
export async function createTeacherAssignmentsBulk(assignments) {
    const token = localStorage.getItem("access_token");
    
    // Asegurar que cada asignación tiene is_tutor = false
    const payload = {
        assignments: assignments.map(a => ({
            professor_id: parseInt(a.professor_id),
            course_offering_id: parseInt(a.course_offering_id),
            is_tutor: false
        }))
    };
    
    const response = await fetch(`${API_URL}/teacher-assignments/teacher-assignments/bulk`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        let errorDetail = "Error creating bulk assignments";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    
    return await response.json();
}
// ==========================================
// PROFESORES ASIGNADOS A UNA COURSE OFFERING (NUEVOS ENDPOINTS)
// ==========================================

/* Obtener todos los profesores asignados a una course offering */
export async function getProfessorsByCourseOffering(courseOfferingId) {
    const response = await apiFetch(`${API_URL}/teacher-assignments/teacher-assignments/course-offering/${courseOfferingId}/all`);
    if (!response.ok) throw new Error("Error al obtener profesores asignados");
    return await response.json();
}

/* Obtener profesores disponibles (no asignados) para una course offering */
export async function getAvailableProfessorsForCourse(courseOfferingId, search = "") {
    let url = `${API_URL}/teacher-assignments/teacher-assignments/course-offering/${courseOfferingId}/available`;
    if (search) {
        url += `?search=${encodeURIComponent(search)}`;
    }
    const response = await apiFetch(url);
    if (!response.ok) throw new Error("Error al obtener profesores disponibles");
    return await response.json();
}

/* Asignar un profesor a una course offering (tutor) */
export async function assignProfessorToCourse(professorEmail, courseOfferingId, isTutor) {
    const response = await apiFetch(`${API_URL}/teacher-assignments/teacher-assignments/assign-tutor`, {
        method: "POST",
        body: JSON.stringify({
            professor_email: professorEmail,
            course_offering_id: courseOfferingId,
            is_tutor: isTutor
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al asignar profesor");
    }
    return await response.json();
}
/* Actualizar estado de tutor de una asignación */
export async function setTutorStatus(assignmentId, isTutor) {
    const response = await apiFetch(`${API_URL}/teacher-assignments/teacher-assignments/${assignmentId}/set-tutor?is_tutor=${isTutor}`, {
        method: "PATCH"
    });
    if (!response.ok) {
        let errorDetail = "Error updating tutor status";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}
// ==========================================
// MATRÍCULAS (ENROLLMENTS)
// ==========================================

/* Obtener todas las matrículas (admin) */
export async function getAllEnrollments() {
    const response = await apiFetch(`${API_URL}/enrollments/`);
    if (!response.ok) throw new Error("Error al obtener matrículas");
    return await response.json();
}

/* Obtener matrículas de un estudiante */
export async function getEnrollmentsByStudent(studentId) {
    const response = await apiFetch(`${API_URL}/enrollments/student/${studentId}`);
    if (!response.ok) throw new Error("Error al obtener matrículas");
    return await response.json();
}

/* Obtener mis propias matrículas (estudiante actual) */
export async function getMyEnrollments() {
    const response = await apiFetch(`${API_URL}/enrollments/my-enrollments`);
    if (!response.ok) throw new Error("Error al obtener matrículas");
    return await response.json();
}

/* Crear matrícula */
export async function createEnrollment(studentId, academicYearId, offeringIds) {
    const response = await apiFetch(`${API_URL}/enrollments/`, {
        method: "POST",
        body: JSON.stringify({ student_id: studentId, academic_year_id: academicYearId, offering_ids: offeringIds })
    });
    if (!response.ok) throw new Error("Error al crear matrícula");
    return await response.json();
}

/* Eliminar matrícula */
export async function deleteEnrollment(enrollmentId) {
    const response = await apiFetch(`${API_URL}/enrollments/${enrollmentId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar matrícula");
    return await response.json();
}

/* Subir matrículas por Excel (versión simple) */
export async function uploadEnrollmentsExcel(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/enrollments/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    if (!response.ok) throw new Error("Error al subir archivo");
    return await response.json();
}

/* Subir matrículas con creación de usuarios (versión avanzada) */
export async function uploadEnrollmentsWithUsersExcel(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/enrollments/upload-with-users`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    if (!response.ok) throw new Error("Error al subir archivo");
    return await response.json();
}

/* Descargar plantilla de matrículas */
export async function downloadEnrollmentsTemplate() {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/enrollments/template`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Error al descargar plantilla");
    return await response.blob();
}

// ==========================================
// EJERCICIOS (EXERCISES)
// ==========================================

/* Obtener ejercicios por oferta de curso */
export async function getExercisesByOffering(offeringId) {
    const response = await apiFetch(`${API_URL}/exercises/exercises/offering/${offeringId}`);
    if (!response.ok) throw new Error("Error al obtener ejercicios");
    return await response.json();
}

/* Obtener ejercicios por asignatura (subject) */
export async function getExercisesBySubject(subjectId) {
    const response = await apiFetch(`${API_URL}/courses/subjects/exercises/subject/${subjectId}`);
    if (!response.ok) throw new Error("Error al obtener ejercicios");
    return await response.json();
}

/* Obtener un ejercicio por ID */
export async function getExerciseById(exerciseId) {
    const response = await apiFetch(`${API_URL}/exercises/exercises/${exerciseId}`);
    if (!response.ok) throw new Error("Error al obtener ejercicio");
    return await response.json();
}

/* Crear ejercicio - CON evaluation_mode */
export async function createExercise(title, description, deadline, courseOfferingId, visibility, solution, evaluation_mode, return_type) {
    const response = await apiFetch(`${API_URL}/exercises/exercises/`, {
        method: "POST",
        body: JSON.stringify({
            title,
            description,
            deadline,
            course_offering_id: courseOfferingId,
            visibility,
            solution,
            evaluation_mode: evaluation_mode,
            return_type: return_type  
        })
    });
    if (!response.ok) throw new Error("Error al crear ejercicio");
    return await response.json();
}
/* Actualizar ejercicio */
export async function updateExercise(exerciseId, data) {
    if (!data || Object.keys(data).length === 0) {
        throw new Error("No data to update");
    }
    
    // Limpiar datos vacíos
    const cleanData = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null && value !== "") {
            cleanData[key] = value;
        }
    }
    
    console.log("Final data being sent:", cleanData);
    
    const response = await apiFetch(`${API_URL}/exercises/exercises/${exerciseId}`, {
        method: "PATCH",
        body: JSON.stringify(cleanData)
    });
    
    if (!response.ok) {
        let errorDetail = "Error al actualizar ejercicio";
        try {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData) || errorDetail;
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}

/* Eliminar ejercicio */
export async function deleteExercise(exerciseId) {
    const response = await apiFetch(`${API_URL}/exercises/exercises/${exerciseId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar ejercicio");
    return await response.json();
}

/* Obtener todas las ofertas de un profesor */
export async function getCourseOfferingsByTeacher(teacherId = null) {
    let url = `${API_URL}/courses/subjects/course-offerings/by-teacher`;
    if (teacherId) {
        url += `?teacher_id=${teacherId}`;
    }
    const response = await apiFetch(url);
    if (!response.ok) throw new Error("Error al obtener ofertas del profesor");
    return await response.json();
}

/* Obtener estudiantes por oferta de curso */
export async function getStudentsByCourseOffering(offeringId) {
    const response = await apiFetch(`${API_URL}/courses/subjects/course-offerings/${offeringId}/students`);
    if (!response.ok) throw new Error("Error al obtener estudiantes");
    return await response.json();
}

// ==========================================
// ENTREGAS (SUBMISSIONS)
// ==========================================

/* Crear entrega */
export async function createSubmission(data) 
{
    const response = await apiFetch(
        `${API_URL}/submissions/submissions/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    if (!response.ok)
    {
        throw new Error("Error create submission");
    }
    return await response.json();
}

/* Obtener mis entregas */
export async function getMySubmissions() {
    const response = await apiFetch(`${API_URL}/submissions/submissions/me`);
    if (!response.ok) throw new Error("Error al obtener entregas");
    return await response.json();
}

/* Obtener entregas por ejercicio (profesor/admin) */
export async function getSubmissionsByExercise(exerciseId) {
    const response = await apiFetch(`${API_URL}/submissions/submissions/exercise/${exerciseId}`);
    if (!response.ok) throw new Error("Error al obtener entregas");
    return await response.json();
}

/* Obtener una entrega por ID */
export async function getSubmissionById(submissionId) {
    const response = await apiFetch(`${API_URL}/submissions/submissions/${submissionId}`);
    if (!response.ok) throw new Error("Error al obtener entrega");
    return await response.json();
}

export async function getTotalSubmissionsCount() {
    const response = await apiFetch(`${API_URL}/submissions/submissions/count`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count;
}
// ==========================================
// EVALUACIONES (EVALUATIONS)
// ==========================================

/* Obtener evaluación por entrega */
export async function getEvaluationBySubmission(submissionId) {
    const response = await apiFetch(`${API_URL}/evaluations/evaluations/submission/${submissionId}`);
    if (!response.ok) return null;
    return await response.json();
}

/* Obtener evaluación por ID */
export async function getEvaluationById(evaluationId) {
    const response = await apiFetch(`${API_URL}/evaluations/evaluations/${evaluationId}`);
    if (!response.ok) throw new Error("Error al obtener evaluación");
    return await response.json();
}

/* Actualizar evaluación (profesor/admin) */
export async function updateEvaluation(evaluationId, score, feedback) {
    const response = await apiFetch(`${API_URL}/evaluations/evaluations/${evaluationId}`, {
        method: "PATCH",
        body: JSON.stringify({ score, feedback })
    });
    if (!response.ok) throw new Error("Error al actualizar evaluación");
    return await response.json();
}

/* Obtener múltiples evaluaciones por IDs de entregas */
export async function getEvaluationsBySubmissionIds(submissionIds) {
    const response = await apiFetch(`${API_URL}/evaluations/evaluations/evaluations/by-submissions`, {
        method: "POST",
        body: JSON.stringify(submissionIds)
    });
    if (!response.ok) throw new Error("Error al obtener evaluaciones");
    return await response.json();
}

// ==========================================
// RESULTADOS DE TESTS
// ==========================================

/* Obtener resultados de tests por evaluación */
export async function getTestResultsByEvaluation(evaluationId) {
    const response = await apiFetch(`${API_URL}/test-results/test-results/evaluation/${evaluationId}`);
    if (!response.ok) return [];
    return await response.json();
}

// ==========================================
// LENGUAJES DE PROGRAMACIÓN
// ==========================================

/* Obtener todos los lenguajes */
export async function getAllProgrammingLanguages() {
    const response = await apiFetch(`${API_URL}/programming-languages/programming-languages/`);
    if (!response.ok) throw new Error("Error al obtener lenguajes");
    return await response.json();
}

/* Crear lenguaje (admin) */
export async function createProgrammingLanguage(name, version) {
    const response = await apiFetch(`${API_URL}/programming-languages/programming-languages/`, {
        method: "POST",
        body: JSON.stringify({ name, version })
    });
    if (!response.ok) throw new Error("Error al crear lenguaje");
    return await response.json();
}

/* Eliminar lenguaje (admin) */
export async function deleteProgrammingLanguage(languageId) {
    const response = await apiFetch(`${API_URL}/programming-languages/programming-languages/${languageId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar lenguaje");
    return await response.json();
}

/* Obtener el lenguaje id */
export async function getProgrammingLanguagesID(languageId) {
    const response = await apiFetch(`${API_URL}/programming-languages/programming-languages/${languageId}`);
    if (!response.ok) throw new Error("Error al obtener el lenguaje");
    return await response.json();
}

// ==========================================
// FUNCIONES DE REPORTES (PARA DASHBOARDS)
// ==========================================

/* Calcular porcentaje de aprobados y nota media de un curso */
export async function getCoursePassData(submissions) {
    const studentScores = new Map();
    const bestExerciseScores = new Map();

    for (const sub of submissions) {
        const evaluation = await getEvaluationBySubmission(sub.id);
        if (!evaluation || evaluation.score === undefined) continue;

        const key = `${sub.student_id}-${sub.exercise_id}`;
        const score = evaluation.score;

        if (!bestExerciseScores.has(key) || score > bestExerciseScores.get(key)) {
            bestExerciseScores.set(key, score);
        }
    }

    for (const [key, score] of bestExerciseScores) {
        const student_id = key.split("-")[0];
        if (!studentScores.has(student_id)) {
            studentScores.set(student_id, []);
        }
        studentScores.get(student_id).push(score);
    }

    let totalPassed = 0;
    let totalAverage = 0;

    for (const scores of studentScores.values()) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        totalAverage += avg;
        if (avg >= 60) totalPassed++;
    }

    const totalStudents = studentScores.size;
    const passRate = totalStudents > 0 ? (totalPassed / totalStudents) * 100 : 0;
    const averageGrade = totalStudents > 0 ? totalAverage / totalStudents : 0;

    return {
        totalPassed,
        passRate: Number(passRate.toFixed(2)),
        averageGrade: Number(averageGrade.toFixed(1))
    };
}


/* Obtener media de mejores notas por estudiante */
export async function getStudentAvgBestNotes(studentId) {
    const response = await apiFetch(`${API_URL}/submissions/submissions/students/${studentId}/avg-best-notes`);
    if (!response.ok) return null;
    return await response.json();
}



/* OBTENER TEST CASES*/
export async function getTestCaseByExercise(exercise_id) 
{
    console.log(exercise_id);
    const response = await apiFetch(`${API_URL}/test-cases/test-cases/exercise/${exercise_id}`);
    if (!response.ok) return null;
    return await response.json();
}
/* Eliminar test case */
export async function deleteTestCase(testCaseId) {
    const response = await apiFetch(`${API_URL}/test-cases/test-cases/${testCaseId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar test case");
    return await response.json();
}
/* Crear test case */
export async function createTestCase(exerciseId, inputData, expectedOutput, isHidden = false) {
    const response = await apiFetch(`${API_URL}/test-cases/test-cases/`, {
        method: "POST",
        body: JSON.stringify({
            exercise_id: exerciseId,
            input_data: inputData,
            expected_output: expectedOutput,
            is_hidden: isHidden  
        })
    });
    if (!response.ok) throw new Error("Error al crear test case");
    return await response.json();
}

/* Actualizar test case */
export async function updateTestCase(testCaseId, inputData, expectedOutput, isHidden) {
    const response = await apiFetch(`${API_URL}/test-cases/test-cases/${testCaseId}`, {
        method: "PATCH",
        body: JSON.stringify({
            input_data: inputData,
            expected_output: expectedOutput,
            is_hidden: isHidden  
        })
    });
    if (!response.ok) {
        let errorDetail = "Error al actualizar test case";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || errorDetail;
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}
/* Asignar lenguaje a ejercicio */
export async function assignLanguageToExercise(exerciseId, languageId) {
    const response = await apiFetch(`${API_URL}/exercise-language/exercise-languages/`, {
        method: "POST",
        body: JSON.stringify({
            exercise_id: exerciseId,
            language_id: languageId
        })
    });
    if (!response.ok) {
        let errorDetail = "Error al asignar lenguaje";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || errorDetail;
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}

/* Eliminar lenguaje de ejercicio */
export async function removeLanguageFromExercise(exerciseId, languageId) {
    // El backend espera query parameters, no path parameters
    const response = await apiFetch(`${API_URL}/exercise-language/exercise-languages/?exercise_id=${exerciseId}&language_id=${languageId}`, {
        method: "DELETE"
    });
    if (!response.ok) {
        let errorDetail = "Error al eliminar lenguaje";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || errorDetail;
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}

/* OBTENER LENGUAJES DE PROGRAMACIÓN DEL EJERCICIO*/
export async function getLanguagesByExercise(exercise_id) 
{
    const response = await apiFetch(`${API_URL}/exercise-language/exercise-languages/exercise/${exercise_id}`);
    if (!response.ok) return null;
    return await response.json();
}

/* RUN TEST CASES */
export async function runTests(data)
{
    const response = await apiFetch(
        `${API_URL}/submissions/submissions/run-tests`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );
    

    if (!response.ok)
    {
        throw new Error("Error running tests");
    }

    return await response.json();
}

export async function getSubmissionFilterOptions()
{
    const response = await apiFetch(
        `${API_URL}/submissions/submissions/filter-options`
    );

    if (!response.ok)
    {
        return null;
    }

    return await response.json();
}

export async function searchSubmissions(params) 
{
    console.log(params.toString());
    const queryString = new URLSearchParams(params).toString();

    const response = await apiFetch(
        `${API_URL}/submissions/submissions/search?${queryString}`
    );

    if (!response.ok) return null;
    return await response.json();
}
/* Exportar submissions a CSV */
export async function exportSubmissionsCSV(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append("status", filters.status);
    if (filters.language_name) params.append("language_name", filters.language_name);
    if (filters.min_score) params.append("min_score", filters.min_score);
    if (filters.max_score) params.append("max_score", filters.max_score);
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);
    if (filters.student_name) params.append("student_name", filters.student_name);
    if (filters.subject_id) params.append("subject_id", filters.subject_id);
    if (filters.passed) params.append("passed", filters.passed);
    
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/submissions/submissions/export?${params.toString()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error("Error exporting submissions");
    }
    
    return await response.blob(); // Devuelve el archivo CSV como Blob
}

/*GET EVALUATION PDF STATUS*/
export async function getEvaluationPdfStatus(submissionId)
{
    const response = await apiFetch(
        `${API_URL}/evaluations/evaluations/submission/${submissionId}/pdf-status`
    );

    if (!response.ok)
    {
        return {
            available: false
        };
    }

    return await response.json();
}

/* DOWNLOAD EVALUATION PDF */
export async function downloadEvaluationPdf(submissionId)
{
    const response = await apiFetch(
        `${API_URL}/evaluations/evaluations/submission/${submissionId}/pdf`
    );

    if (!response.ok)
    {
        return null;
    }

    return await response.blob();
}

export async function getSubmissionStatus(submissionId)
{
    const response = await apiFetch(
        `${API_URL}/submissions/submissions/${submissionId}/status`
    );
    if (!response.ok)
    {
        return null;
    }

    return await response.json();
}

/*CHAT*/ 
export async function getUnreadCount()
{
     const response = await apiFetch(
        `${API_URL}/chat/unread-count`
    );

    return await response.json();
}

export async function getUnreadNotifications()
{
     const response = await apiFetch(
        `${API_URL}/chat/notifications/unread`
    );

    return await response.json();
}

export async function getConversations()
{
    const response = await apiFetch(
        `${API_URL}/chat/conversations`
    );

    return await response.json();
}

export async function getMessages(userId)
{
    const response = await apiFetch(
        `${API_URL}/chat/messages/${userId}`
    );
    return await response.json();
}

export async function getAvailableTeachers()
{
    const response = await apiFetch(
        `${API_URL}/chat/teachers`
    );

    return await response.json();
}

export async function getPresence()
{
    const response = await apiFetch(
        `${API_URL}/chat/presence`
    );

    return await response.json();
}

/* Subir archivo al chat */
export async function uploadChatFile(file, receiverId)
{
    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiver_id", receiverId);

    const token = localStorage.getItem("access_token");
    
    // NO usar apiFetch, hacer fetch directamente para controlar headers
    const response = await fetch(`${API_URL}/chat/upload`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
            // NO poner Content-Type, fetch lo añade automáticamente con el boundary
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error uploading file");
    }

    return await response.json();
}

/* Subir múltiples archivos al chat */
export async function uploadMultipleChatFiles(files, receiverId)
{
    const formData = new FormData();

    for (const file of files) {
        formData.append("files", file);
    }

    formData.append("receiver_id", receiverId);

    const token = localStorage.getItem("access_token");
    
    const response = await fetch(`${API_URL}/chat/upload-multiple`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error uploading files");
    }

    return await response.json();
}


// CHAT WEBSOCKET
let chatSocket = null;

/*Conectar al WebSocket del chat*/
export async function connectChatWebSocket() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("No token available for WebSocket");
        return null;
    }

    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        return chatSocket;
    }

    const wsUrl = `ws://localhost:8000/chat/ws/${token}`;
    chatSocket = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("WebSocket connection timeout"));
        }, 5000);

        chatSocket.onopen = () => {
            clearTimeout(timeout);
            console.log("WebSocket connected");
            resolve(chatSocket);
        };

        chatSocket.onerror = (error) => {
            clearTimeout(timeout);
            console.error("WebSocket error:", error);
            reject(error);
        };
    });
}

/* Enviar mensaje de texto por WebSocket*/
export async function sendChatMessage(receiverId, message) {
    let socket = chatSocket;
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        socket = await connectChatWebSocket();
    }
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error("No se pudo establecer conexión con el chat");
    }
    const messageData = {
        type: "message",
        receiver_id: parseInt(receiverId),
        message: message
    };
    console.log("YO ENVIO ESTO:" + JSON.stringify(messageData));
    socket.send(JSON.stringify(messageData));
    return true;
}

/*Registrar callback para mensajes WebSocket*/
export function onWebSocketMessage(callback) {
    connectChatWebSocket().then(socket => {
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                callback(data);
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };
    }).catch(error => {
        console.error("Error connecting WebSocket:", error);
    });
}

/*Cerrar conexión WebSocket*/
export function disconnectChatWebSocket() {
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.close();
    }
    chatSocket = null;
}

/* Descargar archivo adjunto del chat (versión simple) */
export async function downloadChatAttachment(attachmentId) {
    const token = localStorage.getItem("access_token");
    
    const response = await fetch(`${API_URL}/chat/download/${attachmentId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        let errorMessage = "Error downloading file";
        try {
            const error = await response.json();
            errorMessage = error.detail || errorMessage;
        } catch (e) {
            // Si no se puede parsear JSON, usar texto
            errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
    }

    return await response.blob();
}

/*Eliminar un mensaje (solo el emisor puede hacerlo)*/
export async function deleteChatMessage(messageId) {
    const response = await apiFetch(`${API_URL}/chat/messages/${messageId}`, {
        method: "DELETE"
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al eliminar el mensaje");
    }
    
    return await response.json();
}

/*Eliminar un archivo adjunto (solo el emisor o admin)*/
export async function deleteChatAttachment(attachmentId) {
    const response = await apiFetch(`${API_URL}/chat/attachment/${attachmentId}`, {
        method: "DELETE"
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al eliminar el archivo");
    }
    
    return await response.json();
}

/*Marcar conversación como leída*/
export async function markConversationAsRead(senderId) {
    const response = await apiFetch(`${API_URL}/chat/notifications/mark-read/${senderId}`, {
        method: "POST"
    });
    
    if (!response.ok) {
        throw new Error("Error al marcar mensajes como leídos");
    }
    
    return await response.json();
}


/* Marcar un mensaje específico como leído */
export async function markMessageAsRead(messageId) {
    const response = await apiFetch(`${API_URL}/chat/messages/${messageId}/read`, {
        method: "POST"
    });
    
    if (!response.ok) {
        throw new Error("Error al marcar mensaje como leído");
    }
    
    return await response.json();
}
/* ==========================================
   RANKING
========================================== */

/*Obtener ranking de estudiantes por asignatura*/
export async function getSubjectRanking(subjectId, limit = 100, offset = 0) {
    const response = await apiFetch(
        `${API_URL}/courses/subjects/${subjectId}/ranking?limit=${limit}&offset=${offset}`
    );
    
    if (!response.ok) {
        throw new Error("Error al obtener ranking");
    }
    
    return await response.json();
}

/*Obtener mi posición en el ranking de una asignatura*/
export async function getMySubjectRanking(subjectId) {
    const response = await apiFetch(
        `${API_URL}/courses/subjects/${subjectId}/my-ranking`
    );
    
    if (!response.ok) {
        throw new Error("Error al obtener mi ranking");
    }
    
    return await response.json();
}

// ==========================================
// PROBLEM ARGUMENTS
// ==========================================

/* Obtener argumentos de un ejercicio */
export async function getArgumentsByExercise(exerciseId) {
    console.log("Fetching arguments for exercise:", exerciseId);
    const response = await apiFetch(`${API_URL}/problem-arguments/problem-arguments/exercise/${exerciseId}`);
    if (!response.ok) {
        console.error("Failed to fetch arguments:", response.status);
        return [];
    }
    const data = await response.json();
    console.log("Arguments received:", data);
    return data;
}
/* Crear argumento - SIN description ni default_value */
export async function createArgument(problemId, name, typeName, position) {
    const requestBody = {
        problem_id: parseInt(problemId),
        name: name,
        type_name: typeName,
        position: parseInt(position)
    };
    
    console.log("Creating argument with data:", requestBody);
    
    const response = await apiFetch(`${API_URL}/problem-arguments/problem-arguments/`, {
        method: "POST",
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        let errorDetail = "Error creating argument";
        try {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}
/* Actualizar argumento - SOLO campos que existen */
export async function updateArgument(argumentId, data) {
    const updateData = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type_name !== undefined) updateData.type_name = data.type_name;  // ← type_name
    if (data.position !== undefined) updateData.position = parseInt(data.position);
    
    console.log("Updating argument:", argumentId, updateData);
    
    const response = await apiFetch(`${API_URL}/problem-arguments/problem-arguments/${argumentId}`, {
        method: "PUT",
        body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
        let errorDetail = "Error updating argument";
        try {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}

/* Eliminar argumento */
export async function deleteArgument(argumentId) {
    const response = await apiFetch(`${API_URL}/problem-arguments/problem-arguments/${argumentId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error deleting argument");
    return await response.json();
}

/* Crear múltiples argumentos a la vez (bulk create) */
export async function createArgumentsBulk(exerciseId, argsList) {
    // Convertir al formato que espera el backend
    const argumentsWithProblemId = argsList.map(arg => ({
        problem_id: parseInt(exerciseId),
        name: arg.name,
        type_name: arg.type_name || arg.type || "str",  // Soporta ambos formatos
        position: parseInt(arg.position)
        // description y default_value NO existen en tu modelo
    }));
    
    console.log(`Bulk creating ${argumentsWithProblemId.length} arguments:`, argumentsWithProblemId);
    
    const response = await apiFetch(`${API_URL}/problem-arguments/problem-arguments/bulk`, {
        method: "POST",
        body: JSON.stringify(argumentsWithProblemId)
    });
    
    if (!response.ok) {
        let errorDetail = "Error creating arguments in bulk";
        try {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}

/* Eliminar todos los argumentos de un ejercicio */
export async function deleteAllArgumentsByExercise(exerciseId) {
    console.log("Deleting all arguments for exercise:", exerciseId);  // Debug
    
    const response = await apiFetch(`${API_URL}/problem-arguments/problem-arguments/exercise/${exerciseId}`, {
        method: "DELETE"
    });
    
    if (!response.ok) {
        let errorDetail = "Error deleting arguments";
        try {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}
/* Intercambiar posiciones de argumentos */
export async function swapArgumentPositions(swaps) {
    const requestBody = {
        swaps: swaps
    };
    
    console.log("Swapping argument positions:", requestBody);
    
    const response = await apiFetch(`${API_URL}/problem-arguments/problem-arguments/swap-positions`, {
        method: "POST",
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        let errorDetail = "Error swapping positions";
        try {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}

export async function duplicateExercise(exerciseId, targetOfferingId) {
    const offeringId = parseInt(targetOfferingId);
    console.log("Duplicando:", exerciseId, "al curso:", offeringId);
    
    const response = await apiFetch(`${API_URL}/exercises/exercises/${exerciseId}/duplicate?target_course_offering_id=${offeringId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"  
        }
    });
    
    if (!response.ok) {
        let errorDetail = "Error al duplicar ejercicio";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}
// ==========================================
// RÚBRICAS (RUBRICS)
// ==========================================

/* Obtener rúbrica por ejercicio */
export async function getRubricByExercise(exerciseId) {
    try {
        const response = await apiFetch(`${API_URL}/rubrics/rubrics/exercise/${exerciseId}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null; // No existe rúbrica
            }
            throw new Error("Error al obtener rúbrica");
        }
        return await response.json();
    } catch (error) {
        console.error("Error getting rubric:", error);
        return null;
    }
}

/* Crear rúbrica para un ejercicio */
export async function createRubric(exerciseId, criteria) {
    // criteria puede ser un array O un objeto
    let criteriaObject = {};
    
    if (Array.isArray(criteria)) {
        // Si es array [{name, description}, ...]
        criteria.forEach(c => {
            if (c.name && c.name.trim()) {
                criteriaObject[c.name.trim()] = c.description || "";
            }
        });
    } else {
        // Si ya es objeto, usarlo directamente
        criteriaObject = criteria;
    }
    
    const response = await apiFetch(`${API_URL}/rubrics/rubrics/`, {
        method: "POST",
        body: JSON.stringify({
            exercise_id: exerciseId,
            criteria: criteriaObject
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear rúbrica");
    }
    return await response.json();
}

/* Actualizar rúbrica */
export async function updateRubric(rubricId, data) {
    const response = await apiFetch(`${API_URL}/rubrics/rubrics/${rubricId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al actualizar rúbrica");
    }
    return await response.json();
}

/* Eliminar rúbrica */
export async function deleteRubric(rubricId) {
    const response = await apiFetch(`${API_URL}/rubrics/rubrics/${rubricId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al eliminar rúbrica");
    return await response.json();
}

// ==========================================
// ESTUDIANTES POR COURSE OFFERING
// ==========================================

/* Obtener estudiantes matriculados en una course offering específica */
export async function getStudentsByCourseOfferingEnrollments(offeringId) {
    const response = await apiFetch(`${API_URL}/enrollments/by-offering/${offeringId}`);
    if (!response.ok) throw new Error("Error al obtener estudiantes");
    return await response.json();
}

// BUSCAR ESTUDIANTES POR NOMBRE
export async function searchStudentsByName(searchTerm, offeringId = null) {
    let url = `${API_URL}/enrollments/search-students?q=${encodeURIComponent(searchTerm)}`;
    if (offeringId) {
        url += `&offering_id=${offeringId}`;
    }
    
    const response = await apiFetch(url);
    if (!response.ok) throw new Error("Error al buscar estudiantes");
    return await response.json();
}


// BUSCAR ESTUDIANTES NO MATRICULADOS EN COURSE OFFERING
export async function searchStudentsNotEnrolled(searchTerm, offeringId) {
    const url = `${API_URL}/enrollments/search-not-enrolled?q=${encodeURIComponent(searchTerm)}&offering_id=${offeringId}`;
    const response = await apiFetch(url);
    if (!response.ok) throw new Error("Error al buscar estudiantes no matriculados");
    return await response.json();
}

/* Matricular un estudiante en una course offering específica */
export async function enrollStudentInCourse(studentId, offeringId, academicYearId) {
    const response = await apiFetch(`${API_URL}/enrollments/`, {
        method: "POST",
        body: JSON.stringify({
            student_id: parseInt(studentId),
            academic_year_id: parseInt(academicYearId),
            offering_ids: [parseInt(offeringId)]
        })
    });
    
    if (!response.ok) {
        let errorDetail = "Error enrolling student";
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    
    return await response.json();
}

// ==========================================
// TUTOR VERIFICATION
// ==========================================

/* Obtener los tutores de una course offering específica */
export async function getTutorsByCourseOffering(courseOfferingId) {
    const response = await apiFetch(`${API_URL}/teacher-assignments/teacher-assignments/course-offering/${courseOfferingId}/tutors`);
    if (!response.ok) return [];
    return await response.json();
}


// ==========================================
// DUPLICAR COURSE OFFERING
// ==========================================

/* Obtener course offerings disponibles para duplicar (años anteriores) */
export async function getOfferingsAvailableForDuplicate() {
    const response = await apiFetch(`${API_URL}/course-offerings/course-offerings/available-for-duplicate`);
    if (!response.ok) throw new Error("Error al obtener ofertas disponibles para duplicar");
    return await response.json();
}

/* Duplicar una course offering completa */
export async function duplicateCourseOffering(offeringId, targetAcademicYearId) {
    const yearId = parseInt(targetAcademicYearId);
    
    console.log("Duplicando offering:", offeringId, "al año académico:", yearId);
    

    const response = await apiFetch(`${API_URL}/course-offerings/course-offerings/${offeringId}/duplicate?new_academic_year_id=${yearId}`, {
        method: "POST"
    });
    
    if (!response.ok) {
        let errorDetail = "Error al duplicar la asignatura";
        try {
            const errorData = await response.json();
            console.error("Error response from backend:", errorData);
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
    }
    return await response.json();
}


/* Obtener todas las sesiones del usuario actual */
export async function getSessions() {
    const response = await apiFetch(`${API_URL}/sessions/`);
    if (!response.ok) throw new Error("Error al obtener las sesiones");
    return await response.json();
}

/* Obtener mis sesiones (alias de getSessions) */
export async function getMySessions() {
    const response = await apiFetch(`${API_URL}/sessions/me`);
    if (!response.ok) throw new Error("Error al obtener mis sesiones");
    return await response.json();
}

/* Revocar una sesión específica por ID */
export async function revokeSession(sessionId) {
    const response = await apiFetch(`${API_URL}/sessions/${sessionId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al revocar la sesión");
    return await response.json();
}

/* Revocar todas mis sesiones (cerrar sesión en todos los dispositivos) */
export async function revokeAllSessions() {
    const response = await apiFetch(`${API_URL}/sessions/me`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al revocar todas las sesiones");
    return await response.json();
}

/* Contar usuarios por rol (admin) */
export async function getUsersByRoleCount() {
    const response = await apiFetch(`${API_URL}/users/users/count-by-role`);
    if (!response.ok) return { admins: 0, professors: 0, students: 0 };
    return await response.json();
}

/* Buscar usuarios por término (admin) */
export async function searchUsers(searchTerm) {
    const response = await apiFetch(`${API_URL}/users/users/search?q=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) throw new Error("Error al buscar usuarios");
    return await response.json();
}

/* Obtener todas las sesiones activas de un usuario (admin) */
export async function getUserSessions(userId) {
    const response = await apiFetch(`${API_URL}/users/${userId}/sessions`);
    if (!response.ok) throw new Error("Error al obtener sesiones del usuario");
    return await response.json();
}

/* Revocar una sesión específica de un usuario (admin) */
export async function revokeUserSession(userId, sessionId) {
    const response = await apiFetch(`${API_URL}/users/${userId}/sessions/${sessionId}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al revocar sesión");
    return await response.json();
}

/* Revocar todas las sesiones de un usuario (admin) */
export async function revokeAllUserSessions(userId) {
    const response = await apiFetch(`${API_URL}/users/${userId}/sessions`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Error al revocar todas las sesiones");
    return await response.json();
}

// ==========================================
// FORGOT PASSWORD (solicitar restablecimiento)
// ==========================================
export async function forgotPassword(email) {
    const response = await fetch(`${API_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error sending reset link");
    }
    return await response.json();
}
// ==========================================
// RESET PASSWORD (establecer nueva contraseña con token)
// ==========================================
export async function resetPassword(token, newPassword) {
    const response = await fetch(`${API_URL}/auth/reset-password?token=${encodeURIComponent(token)}&new_password=${encodeURIComponent(newPassword)}`, {
        method: "POST"
        // Sin headers, sin body
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al restablecer la contraseña");
    }
    return await response.json();
}

// ==========================================
// CAMBIAR CONTRASEÑA (con verificación de la actual)
// ==========================================
export async function changeMyPasswordWithVerification(currentPassword, newPassword) {
    const response = await apiFetch(`${API_URL}/users/me/change-password`, {
        method: "PATCH",
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al cambiar la contraseña");
    }
    // Si el backend devuelve el usuario actualizado, lo aprovechamos
    const data = await response.json();
    // Actualizar flag de cambio requerido (por si acaso)
    localStorage.setItem("password_change_required", "false");
    return data;
}

// ==========================================
// SYSTEM SERVICES & LOGS
// ==========================================

/* Obtener estado de los servicios del sistema (solo admin) */
export async function getSystemServices() {
    const response = await apiFetch(`${API_URL}/system/services`);
    if (!response.ok) throw new Error("Error al obtener servicios del sistema");
    return await response.json();
}

