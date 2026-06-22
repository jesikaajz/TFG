import monaco from "../monaco";
let currentEditor = null;
let currentArgumentsCache = [];   // Cache de argumentos para el ejercicio actual
let currentReturnTypeCache = 'any'; // Cache del tipo de retorno
// Convierte entrada amigable a JSON
function convertToJSON(inputText) {
    if (!inputText || inputText.trim() === "") return null;
    
    const trimmed = inputText.trim();
    
    // 1. Si ya parece JSON válido, devolverlo tal cual
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            JSON.parse(trimmed);
            return trimmed;
        } catch(e) {
            // No es JSON válido, continuar con conversión
        }
    }
    
    // 2. Detectar formato "a = 5, b = 6" o "a=5, b=6"
    const keyValuePattern = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^,]+)(?:,|$)/g;
    const matches = [...inputText.matchAll(keyValuePattern)];
    
    if (matches.length > 0) {
        const obj = {};
        for (const match of matches) {
            let key = match[1].trim();
            let value = match[2].trim();
            
            // Convertir valor al tipo apropiado
            obj[key] = parseValue(value);
        }
        return JSON.stringify(obj);
    }
    
    // 3. Detectar solo valores separados por comas "5, 6, 7"
    if (trimmed.includes(',')) {
        const values = trimmed.split(',').map(v => parseValue(v.trim()));
        if (values.length > 1) {
            return JSON.stringify(values);
        }
    }
    
    // 4. Valor único
    return JSON.stringify(parseValue(trimmed));
}

// Parsea un valor a su tipo correspondiente
function parseValue(value) {
    if (!value) return null;
    
    const trimmed = value.trim();
    
    // Booleanos
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    
    // null
    if (trimmed.toLowerCase() === 'null') return null;
    
    // Números
    if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed);
    if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
    
    // Strings (eliminar comillas si las tiene)
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    
    // Arrays en formato legible [1, 2, 3]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            return JSON.parse(trimmed);
        } catch(e) {
            return trimmed;
        }
    }
    
    // Objetos en formato legible {a:1, b:2}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            // Convertir comillas simples a dobles para JSON válido
            const fixed = trimmed.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
            return JSON.parse(fixed);
        } catch(e) {
            return trimmed;
        }
    }
    
    // Por defecto, string
    return trimmed;
}

// Formatea JSON para mostrar de forma legible
function formatJSONForDisplay(jsonString) {
    if (!jsonString) return "";
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
    } catch(e) {
        return jsonString;
    }
}

// Actualizar el textarea con el JSON generado
function updateJSONFromFriendly(inputId, outputId) {
    const friendlyInput = document.getElementById(inputId);
    const jsonOutput = document.getElementById(outputId);
    
    if (friendlyInput && jsonOutput) {
        const jsonValue = convertToJSON(friendlyInput.value);
        if (jsonValue) {
            jsonOutput.value = formatJSONForDisplay(jsonValue);
        } else {
            jsonOutput.value = "";
        }
    }
}


export function setActiveMenu(index)
{
    const items = document.querySelectorAll(".menu-item");

    items.forEach(item =>
        item.classList.remove("active")
    );

    if (items[index])
    {
        items[index].classList.add("active");
    }
}


export function renderMainStudent(subjects = [], exercises = [], role) {
    const main = document.querySelector(".content");
    if (!main) {
        console.error("No se encontró .content");
        return;
    }

    // ========== AGRUPACIÓN DE EJERCICIOS PARA LA TARJETA "NEEDS ATTENTION" ==========
    const today = new Date();
    const closed = [];
    const openWithDeadline = [];
    const noDeadline = [];

    exercises.forEach(ex => {
        const hasDeadline = ex.deadline && ex.deadline !== "null";
        const deadline = hasDeadline ? new Date(ex.deadline) : null;
        const isClosed = hasDeadline ? deadline < today : false;

        if (isClosed) {
            closed.push(ex);
        } else if (hasDeadline) {
            openWithDeadline.push(ex);
        } else {
            noDeadline.push(ex);
        }
    });

    const sortByDeadline = (a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    };
    openWithDeadline.sort(sortByDeadline);
    closed.sort(sortByDeadline);
    // noDeadline sin orden adicional

    // Función para generar el HTML de los ejercicios de un grupo, agrupados por asignatura
    const generateGroupedTasks = (exerciseArray) => {
        const grouped = {};
        exerciseArray.forEach(ex => {
            if (!grouped[ex.subject_id]) grouped[ex.subject_id] = [];
            grouped[ex.subject_id].push(ex);
        });
        return Object.entries(grouped).map(([subjectId, exs]) => `
            <div class="course-tasks">
                <h3>${exs[0].subject_name}</h3>
                ${exs.map(task => `
                    <div class="task-item">
                        <div class="task-header">
                            <strong>${task.title}</strong>
                        </div>
                        <span class="task-date">
                            ${task.deadline ? new Date(task.deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric" }) : "No deadline"}
                        </span>
                        <button class="continue-btn" data-id="${task.id}">
                            Continue Working
                        </button>
                    </div>
                `).join("")}
            </div>
        `).join("");
    };

    let tasksHTML = "";
    if (exercises.length === 0) {
        tasksHTML = "<p>No exercises available</p>";
    } else {
        // Sección 1: Abiertos con deadline
        if (openWithDeadline.length > 0) {
            tasksHTML += `<div class="tasks-section-header">⏳ Upcoming Deadlines (${openWithDeadline.length})</div>`;
            tasksHTML += generateGroupedTasks(openWithDeadline);
        }
        // Sección 2: Sin deadline
        if (noDeadline.length > 0) {
            tasksHTML += `<div class="tasks-section-header">🔄 No Deadline (${noDeadline.length})</div>`;
            tasksHTML += generateGroupedTasks(noDeadline);
        }
        // Sección 3: Cerrados
        if (closed.length > 0) {
            tasksHTML += `<div class="tasks-section-header">📅 Closed (${closed.length})</div>`;
            tasksHTML += generateGroupedTasks(closed);
        }
    }
    // ========== FIN AGRUPACIÓN ==========

    main.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-header">
                <h1>Student Dashboard</h1>
                <p>Here's an overview of your progress and upcoming tasks.</p>
            </div>
            <div class="dashboard-grid">
                <!-- SUBJECTS (antes COURSES) -->
                <div class="card courses-card">
                    <h2>My Subjects</h2>
                    <div class="courses-list">
                        ${subjects.length === 0
                            ? "<p>No subjects available</p>"
                            : subjects.map(subject => `
                                <div class="course-item" data-id="${subject.id}">
                                    <div class="course-icon">
                                        <img src="src/img/courses.png" class="icon">
                                    </div>
                                    <div class="course-info">
                                        <h3>${subject.name}</h3>
                                    </div>
                                </div>
                            `).join("")
                        }
                    </div>
                </div>
                <!-- TASKS (NEEDS ATTENTION) -->
                <div class="card tasks-card">
                    <h2>Needs Attention</h2>
                    <div class="tasks-list">
                        ${tasksHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const userDiv = document.querySelector(".user");
    const avatar = document.createElement("div");
    const portal = document.querySelector(".header-center");
    userDiv.innerHTML = "";
    portal.innerHTML = "";
    avatar.classList.add("avatar");
    avatar.textContent = role?.charAt(0).toUpperCase() || "U";
    const span = document.createElement("span");
    const span2 = document.createElement("span");
    span.textContent = "Student User";
    span2.textContent = "Student Portal";
    userDiv.appendChild(avatar);
    userDiv.appendChild(span);
    portal.appendChild(span2);
}


export function RenderMainAdmin(totalUsers , totalCourses,role) 
{
    const main = document.querySelector(".content");

    if (!main) 
    {
        console.error("No se encontró .content");
        return;
    }

    main.innerHTML = `
        <div class="dashboard">

            <div class="dashboard-header">
                <h1>Admin Dashboard</h1>
                <p>System overview and management console.</p>
            </div>

            <div class="stats-grid">

                <div class="stat-card">
                    <span class="stat-title">Total Users</span>
                    <h2 class="stat-number">${totalUsers}</h2>
                </div>

                <div class="stat-card">
                    <span class="stat-title">Active Courses</span>
                    <h2 class="stat-number">${totalCourses}</h2>
                </div>

                <div class="stat-card">
                    <span class="stat-title">System Health</span>
                    <h2 class="stat-number">99.9%</h2>
                </div>

            </div>

            <div class="quick-actions-card">

                <h2>Quick Actions</h2>

                <div class="actions-grid">

                    <button class="action-btn" id="addUserBtn">
                        <img src="src/img/users.png" class="icon">
                        <span>Add User</span>
                    </button>

                    <button class="action-btn" id="newCourseBtn">
                        <img src="src/img/courses.png" class="icon">
                        <span>New Course</span>
                    </button>

                    <button class="action-btn" id="systemConfigBtn">
                        <img src="src/img/ajustes.png" class="icon">
                        <span>System Config</span>
                    </button>

                </div>

            </div>

        </div>
    `;
    const userDiv = document.querySelector(".user");
    const avatar = document.createElement("div");
    const portal = document.querySelector(".header-center");
    userDiv.innerHTML = "";
    portal.innerHTML = "";
    avatar.classList.add("avatar");
    avatar.textContent = role.charAt(0).toUpperCase();
    const span = document.createElement("span");
    const span2 = document.createElement("span");
    span.textContent = "Admin User";
    span2.textContent = "Admin Portal";
    userDiv.appendChild(avatar);
    userDiv.appendChild(span);
    portal.appendChild(span2);
}



export function renderMainTeacher(totalCourses, totalStudents, totalSubmissions, avgPassRate, submissions, role) 
{
    const main = document.querySelector(".content");

    if (!main) return;

    main.innerHTML = `
        <div class="dashboard">

            <!-- HEADER -->
            <div class="dashboard-header">

                <div>
                    <h1>Professor Dashboard</h1>

                    <p>
                        Manage your courses, exercises, and review submissions.
                    </p>
                </div>

                <button class="primary-btn" id="createExerciseFromDashboardBtn">
                    + Create New Exercise
                </button>

            </div>

            <!-- STATS -->
            <div class="stats-grid">

                <div class="stat-card">
                    <span>Active Courses</span>
                    <h2>${totalCourses}</h2>
                </div>

                <div class="stat-card">
                    <span>Total Students</span>
                    <h2>${totalStudents}</h2>
                </div>

                <div class="stat-card">
                    <span>Total Submissions</span>
                    <h2>${totalSubmissions}</h2>
                </div>

                <div class="stat-card">
                    <span>Avg. Pass Rate</span>
                    <h2>${avgPassRate}%</h2>
                </div>

            </div>

            <!-- TABLE -->
            <div class="table-card">

                <h2>Recent Submissions</h2>

                <table class="submissions-table">

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student</th>
                            <th>Course</th>
                            <th>Exercise</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${
                            submissions.length === 0

                            ? `
                                 <tr>
                                    <td colspan="6">
                                        No submissions
                                     </td>
                                 </tr>
                              `

                            : submissions.map(submission => `
                                
                                <tr>

                                    <td class="table-id">
                                        ${submission.id}
                                     </td>

                                    <td class="table-student">
                                        ${submission.student_name}
                                     </td>

                                    <td class="table-course">
                                        ${submission.subject_name}
                                     </td>

                                    <td class="table-exercise">
                                        ${submission.exercise_name}
                                     </td>

                                    <td>    
                                        <span class="status ${submission.status.toLowerCase().replace(/\s+/g, "-")}">
                                            ${submission.status}
                                        </span>
                                     </td>

                                    <td>
                                        <button class="secondary-btn view-submission-btn" data-submission-id="${submission.id}" data-from="dashboard">
                                            View Result
                                        </button>
                                     </td>

                                </tr>

                            `).join("")
                        }

                    </tbody>

                 </table>

            </div>

        </div>
    `;

    // ---------------- USER INFO ----------------

    const userDiv = document.querySelector(".user");
    const portal = document.querySelector(".header-center");

    const avatar = document.createElement("div");

    userDiv.innerHTML = "";
    portal.innerHTML = "";

    avatar.classList.add("avatar");

    avatar.textContent = role.charAt(0).toUpperCase();

    const span = document.createElement("span");
    span.textContent = "Teacher User";

    const span2 = document.createElement("span");
    span2.textContent = "Teacher Portal";

    userDiv.appendChild(avatar);
    userDiv.appendChild(span);

    portal.appendChild(span2);
}

export function renderCourses(subjects, rol, academicYears = [], currentAcademicYear = null) {
    const main = document.querySelector(".content");
    if (!main) return;
    
    main.innerHTML = "";

    const header = document.createElement("div");
    header.classList.add("courses-header");
    
    // Crear selector de años (para teacher, admin Y student)
    let academicYearSelectorHTML = '';
    if (academicYears && academicYears.length > 0 && (rol === "teacher" || rol === "admin" || rol === "student")) {
        academicYearSelectorHTML = `
            <div class="academic-year-selector">
                <label for="academicYearSelect">📅 Academic Year:</label>
                <select id="academicYearSelect" class="academic-year-select">
                    ${academicYears.map(year => `
                        <option value="${year.id}" ${currentAcademicYear && currentAcademicYear.id === year.id ? 'selected' : ''}>
                            ${year.start_year}-${year.end_year}
                        </option>
                    `).join("")}
                </select>
            </div>
        `;
    }
    
    // Cambiar el título y descripción según el rol
    let pageTitle = "";
    let pageDescription = "";
    
    if (rol === "student") {
        pageTitle = "My Subjects";
        pageDescription = "Browse your enrolled subjects by academic year.";
    } else if (rol === "teacher") {
        pageTitle = "My Courses";
        pageDescription = "Browse and manage the courses you teach.";
    } else if (rol === "admin") {
        pageTitle = "All Courses";
        pageDescription = "Browse and manage all course offerings in the system.";
    } else {
        pageTitle = "Courses";
        pageDescription = "Browse and manage your courses.";
    }
    
    header.innerHTML = `
        <div class="header-left2">
            <h1>${escapeHtmlContent(pageTitle)}</h1>
            <p>${escapeHtmlContent(pageDescription)}</p>
        </div>
        <div class="header-right2">
            ${academicYearSelectorHTML}
            <input type="text" placeholder="Search subjects..." class="search-input" id="courseSearchInput">
            ${(rol === "teacher" || rol === "admin") ? `<button class="duplicate-course-offering-btn" id="duplicateCourseOfferingBtn">🔄 Duplicate Course</button>` : ""}
            ${rol === "admin" ? `<button class="create-course-btn" id="createSubjectBtn">+ Create Subject</button>` : ""}
        </div>
    `;
    main.appendChild(header);

    // Mostrar mensaje informativo si es admin o teacher y no hay cursos
    if (currentAcademicYear && subjects.length === 0 && (rol === "teacher" || rol === "admin")) {
        const infoMessage = document.createElement("div");
        infoMessage.classList.add("info-message");
        infoMessage.innerHTML = `
            <div class="alert-info">
                <span>ℹ️</span>
                <div>
                    <p><strong>No courses available for ${currentAcademicYear.start_year}-${currentAcademicYear.end_year}</strong></p>
                    <p>Try duplicating a course from a previous year using the "Duplicate Course" button.</p>
                </div>
            </div>
        `;
        main.appendChild(infoMessage);
    }

    const container = document.createElement("div");
    container.classList.add("courses-container");
    container.id = "coursesContainer";

    if (subjects.length === 0) {
        let emptyMessage = "";
        
        if (rol === "student") {
            emptyMessage = `You are not enrolled in any subjects for ${currentAcademicYear?.start_year || ''}-${currentAcademicYear?.end_year || ''}.`;
        } else if (rol === "teacher") {
            emptyMessage = `You are not teaching any courses for ${currentAcademicYear?.start_year || ''}-${currentAcademicYear?.end_year || ''}.`;
        } else if (rol === "admin") {
            emptyMessage = `No course offerings available for ${currentAcademicYear?.start_year || ''}-${currentAcademicYear?.end_year || ''}.`;
        } else {
            emptyMessage = "No courses available for this academic year.";
        }
            
        container.innerHTML = `
            <div class="empty-courses-message">
                <p>${escapeHtmlContent(emptyMessage)}</p>
                ${(rol === "teacher" || rol === "admin") ? '<p class="hint">Click "Duplicate Course" to copy courses from previous years.</p>' : ''}
                ${rol === "student" && currentAcademicYear ? '<p class="hint">Try selecting a different academic year from the dropdown above.</p>' : ''}
            </div>
        `;
    } else {
        subjects.forEach(subject => {
            const card = document.createElement("div");
            card.classList.add("course-card");
            card.dataset.subjectName = (subject.name || "").toLowerCase();
            card.dataset.offeringId = subject.offering_id;
            
            // Texto para mostrar en la tarjeta
            const exercisesCount = subject.exercisesCount || 0;
            const studentsCount = subject.studentsCount || 0;
            const exercisesText = `${exercisesCount} Exercise${exercisesCount !== 1 ? 's' : ''}`;
            const studentsText = `${studentsCount} Student${studentsCount !== 1 ? 's' : ''}`;
            
            const pastOfferingsBadge = subject.has_past_offerings ? 
                '<span class="badge-past-offerings">📋 Has past versions</span>' : '';
            
            // Mejora: solo mostrar badge para admin (siempre "Active") y para profesor si el curso tiene profesor
            let statusText = '';
            let statusClass = '';
            if (rol === "admin") {
                statusText = 'Active';
                statusClass = 'active';
            } else if (rol === "teacher" && subject.hasTeacher) {
                statusText = 'Active';
                statusClass = 'active';
            }
            // Para estudiantes y profesores sin profesor no se muestra badge
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="icon-box">
                        <img src="src/img/courses.png" class="card-icon">
                    </div>
                    ${statusText ? `<span class="status ${statusClass}">${statusText}</span>` : ''}
                </div>
                <h3 class="course-title">${escapeHtmlContent(subject.name)}</h3>
                <p class="course-code">Course ID: ${subject.offering_id}</p>
                <div class="course-stats">
                    <span class="stat-badge">📚 ${exercisesText}</span>
                    <span class="stat-badge">👥 ${studentsText}</span>
                    ${pastOfferingsBadge}
                </div>
                <div class="divider-line"></div>
                <div class="card-footer">
                    <button class="btn-details" data-id="${subject.offering_id}" data-subject-id="${subject.subject_id || subject.id}">
                        View Details
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }
    
    main.appendChild(container);
}
/* EXERCISES */
export function renderExercises(exercises, subjects = [], rol) {
    const main = document.querySelector(".content");
    main.innerHTML = "";

    const getSubjectName = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? subject.name : "Unknown";
    };

    const showStatus = rol === "student";
    const showVisibility = rol === "teacher" || rol === "admin";
    const showStatusForTeacher = rol === "teacher" || rol === "admin";
    const showAcademicYear = rol === "admin"; // Solo admin ve el año académico

    // ========== AGRUPACIÓN ==========
    const today = new Date();
    const closed = [];
    const openWithDeadline = [];
    const noDeadline = [];

    exercises.forEach(ex => {
        const hasDeadline = ex.deadline && ex.deadline !== "null";
        const deadline = hasDeadline ? new Date(ex.deadline) : null;
        const isClosed = hasDeadline ? deadline < today : false;

        if (isClosed) {
            closed.push(ex);
        } else if (hasDeadline) {
            openWithDeadline.push(ex);
        } else {
            noDeadline.push(ex);
        }
    });

    // Ordenar por fecha
    const sortByDeadline = (a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    };
    openWithDeadline.sort(sortByDeadline);
    closed.sort(sortByDeadline);

    // Función para generar filas de un grupo
    const generateRows = (exerciseArray) => {
        let rows = "";
        exerciseArray.forEach(ex => {
            const now = new Date();
            const hasDeadline = ex.deadline && ex.deadline !== "null";
            const deadline = hasDeadline ? new Date(ex.deadline) : null;
            const isClosed = hasDeadline ? deadline < now : false;
            const statusText = isClosed ? "Closed" : "Open";
            const statusClass = isClosed ? "expired" : "pending";

            const isVisible = ex.is_visible !== false && ex.visibility !== false;

            let actions = "";
            if (rol === "teacher" || rol === "admin") {
                actions = `
                    <button class="view-btn edit-exercise-btn" data-id="${ex.id}">Edit</button>
                    <button class="duplicate-exercise-btn-icon" data-id="${ex.id}" data-title="${escapeHtmlContent(ex.title)}" title="Duplicate exercise">
                        <img src="src/img/copiar.png" class="duplicate-icon" alt="Duplicate">
                    </button>
                    <button class="view-btn submissions-btn" data-id="${ex.id}">View Submissions</button>
                    <button class="primary-btn start-coding-btn" data-id="${ex.id}" data-courseid="${ex.course_offering_id}" data-from-exercises="true">Start Coding</button>
                `;
            } else {
                if (isClosed) {
                    actions = ex.submissions?.length > 0
                        ? `<button class="view-btn submissions-btn" data-id="${ex.id}">View Submissions (${ex.submissions.length})</button>`
                        : `<button class="disabled-btn" disabled>No Submissions</button>`;
                } else {
                    actions = `<button class="primary-btn" data-id="${ex.id}">Start Coding</button>`;
                    if (ex.submissions?.length > 0) {
                        actions += `<button class="view-btn submission-btn" data-id="${ex.id}">View Submissions (${ex.submissions.length})</button>`;
                    }
                }
            }

            rows += `
                <tr>
                    <td class="exercise-name-cell">
                        <div class="exercise-name">${escapeHtmlContent(ex.title)}</div>
                    </td>
                    <td class="subject-cell">${escapeHtmlContent(getSubjectName(ex.subject_id))}</td>
                    ${showAcademicYear ? `<td class="academic-year-cell">${escapeHtmlContent(ex.academic_year || 'Unknown')}</td>` : ''}
                    <td class="deadline-cell">${ex.deadline ? formatDate(ex.deadline) : "No deadline"}</td>
                    ${showVisibility ? `<td class="visibility-cell"><span class="visibility-badge ${isVisible ? 'visible' : 'is-hidden'}">${isVisible ? 'Visible' : 'Hidden'}</span></td>` : ""}
                    ${showStatusForTeacher ? `<td class="status-cell"><span class="badge ${statusClass}">${statusText}</span></td>` : ""}
                    ${showStatus ? `<td class="status-cell"><span class="badge ${statusClass}">${statusText}</span></td>` : ""}
                    <td class="actions-cell">
                        <div class="exercise-actions">
                            ${actions}
                            ${rol === "admin" ? `<button class="delete-exercise-btn" data-id="${ex.id}" data-title="${escapeHtmlContent(ex.title)}" title="Delete exercise">🗑️ Delete</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        return rows;
    };

    // Construir tabla con grupos
    let tableHTML = `
        <div class="exercises-page">
            <h2>Exercises</h2>
            <p class="exercises-subtitle">Practice and submit your coding assignments.</p>
            <div class="exercises-actions">
                <div class="exercises-left-actions">
                    <input type="text" id="exerciseSearchInput" placeholder="Search exercises...">
                </div>
                ${rol === "teacher" || rol === "admin" ? `<button class="create-exercise-btn">+ Create Exercise</button>` : ""}
            </div>
            <div class="exercises-groups-container" id="exercisesGroupsContainer">
    `;

    const renderGroup = (title, group, icon, groupClass) => {
        if (group.length === 0) return "";
        return `
            <div class="exercise-group-card">
                <div class="exercise-group-header ${groupClass}">
                    <span class="group-icon">${icon}</span>
                    <span class="group-title">${title} (${group.length})</span>
                </div>
                <table class="exercises-table">
                    <thead>
                        <tr>
                            <th>Exercise</th>
                            <th>Subject</th>
                            ${showAcademicYear ? '<th>Academic Year</th>' : ''}
                            <th>Due date</th>
                            ${showVisibility ? "<th>Visibility</th>" : ""}
                            ${showStatusForTeacher ? "<th>Status</th>" : ""}
                            ${showStatus ? "<th>Status</th>" : ""}
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateRows(group)}
                    </tbody>
                </table>
            </div>
        `;
    };

    tableHTML += renderGroup("Upcoming Deadlines", openWithDeadline, "⏳", "upcoming");
    tableHTML += renderGroup("No Deadline", noDeadline, "🔄", "nodeadline");
    tableHTML += renderGroup("Closed Exercises", closed, "📅", "closed");
    tableHTML += `</div></div>`;

    main.innerHTML = tableHTML;
}


function formatDate(dateString) {
    if (!dateString) return "No deadline";
    // Asegurar que se trata como UTC (sin sumar zona horaria)
    const date = new Date(dateString + 'Z'); // fuerza a UTC
    return date.toLocaleString("es-ES", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).replace(",", "");
}

// SELECTOR DE TIPO DE BÚSQUEDA
function renderSearchTypeSelector(selectedType = "student", rol = null) {
    let options = '';
    if (rol === "student") {
        // Para estudiantes: solo Exercise y Subject
        options = `
            <option value="exercise" ${selectedType === "exercise" ? "selected" : ""}>📘 Search by Exercise</option>
            <option value="subject" ${selectedType === "subject" ? "selected" : ""}>📚 Search by Subject</option>
        `;
    } else {
        // Para teacher/admin: todas las opciones
        options = `
            <option value="student" ${selectedType === "student" ? "selected" : ""}>👤 Search by Student</option>
            <option value="exercise" ${selectedType === "exercise" ? "selected" : ""}>📘 Search by Exercise</option>
            <option value="subject" ${selectedType === "subject" ? "selected" : ""}>📚 Search by Subject</option>
        `;
    }
    return `
        <div class="search-type-wrapper">
            <select id="searchTypeSelect" class="search-type-select">
                ${options}
            </select>
        </div>
    `;
}

export async function renderSubmissions(
    submissions,
    exercises,
    courses,
    evaluations = [],
    users = [],
    rol,
    academicYears = [],
    currentAcademicYearId = null,
    searchType = "student",
    searchValue = ""
) {
    const main = document.querySelector(".content");

    const evaluationMap = {};
    evaluations.forEach(ev => {
        evaluationMap[ev.submission_id] = ev;
    });

    const userMap = {};
    users.forEach(user => {
        userMap[user.id] = user;
    });

    const courseMap = new Map();
    courses.forEach(c => {
        courseMap.set(c.id, c.name);
    });

    const showAcademicYear = (rol === "admin");

    let academicYearSelectorHTML = '';
    if (rol === "admin" && academicYears && academicYears.length > 0) {
        academicYearSelectorHTML = `
            <div class="academic-year-selector" style="margin-bottom: 15px;">
                <label for="submissionAcademicYearSelect">📅 Filter by Academic Year:</label>
                <select id="submissionAcademicYearSelect" class="academic-year-select">
                    <option value="">All years</option>
                    ${academicYears.map(year => `
                        <option value="${year.id}" ${currentAcademicYearId == year.id ? 'selected' : ''}>
                            ${year.start_year}-${year.end_year}
                        </option>
                    `).join("")}
                </select>
            </div>
        `;
    }

    main.innerHTML = `
        <h2>Submissions History</h2>
        <p class="submissions-subtitle">Review automated evaluation results and feedback.</p>
        ${academicYearSelectorHTML}
        <div class="submissions-actions">
            ${renderSearchTypeSelector(searchType, rol)}
            <input type="text" id="searchInput" placeholder="Search..." value="${escapeHtmlContent(searchValue)}">
            <button class="filter-btn">
                <img src="src/img/filtrar.png" class="filter-icon-img" alt="Filter">
                <span>Filters</span>
            </button>
        </div>
        <table class="submissions-table">
            <thead>
                <tr>
                    <th>ID</th>
                    ${rol === "teacher" || rol === "admin" ? "<th>STUDENT</th>" : ""}
                    <th>EXERCISE</th>
                    <th>COURSE</th>
                    ${showAcademicYear ? "<th>ACADEMIC YEAR</th>" : ""}
                    <th>LANGUAGE</th>
                    <th>SCORE</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th>ACTION</th>
                </tr>
            </thead>
            <tbody>
                ${submissions.map(sub => {
                    const exercise = exercises?.find(e => e.id === sub.exercise_id);
                    let courseName = sub.subject_name || (exercise ? courseMap.get(exercise.subject_id) : null) || "Unknown";
                    const evaluation = evaluationMap[sub.id];
                    const user = userMap[sub.student_id];
                    const scoreText = evaluation ? `${Math.round(evaluation.score)}/100` : "-";
                    const buttonDisabled = evaluation ? "" : "disabled";
                    const languageName = sub.language_name || "Unknown";
                    const academicYear = sub.academic_year || "Unknown";

                    return `
                        <tr>
                            <td>#${sub.id}</td>
                            ${rol === "teacher" || rol === "admin" ? `<td>${user?.name || "Unknown"}</td>` : ""}
                            <td>${exercise?.title || "Unknown"}</td>
                            <td>${courseName}</td>
                            ${showAcademicYear ? `<td>${academicYear}</td>` : ""}
                            <td>${languageName}</td>
                            <td>${scoreText}</td>
                            <td><span class="badge ${sub.status}">${sub.status}</span></td>
                            <td>${sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "N/A"}</td>
                            <td><button class="view-btn" data-submission-id="${sub.id}" data-from="submissions" ${buttonDisabled}>View Report</button></td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}
/* STUDENT REPORTS */
export async function renderStudentReports(reportData)
{
    const main =
        document.querySelector(".content");

    main.innerHTML = `

        <section class="reports-section">

            <div class="reports-header">

                <h1>
                    My Progress Analytics
                </h1>

                <p>
                    Track your grades, progress and exercise status.
                </p>

            </div>

            <div class="reports-grid student-grid">

                <!-- =========================
                     GRADE EVOLUTION
                ========================== -->
                <div class="report-card">

                    <h2>
                        Grade Evolution
                    </h2>

                    <canvas
                        id="gradeEvolutionChart"
                    >
                    </canvas>

                </div>

                <!-- =========================
                     GRADES BY COURSE
                ========================== -->
                <div class="report-card">

                    <h2>
                        Grades by Course
                    </h2>

                    <canvas
                        id="gradesByCourseChart"
                    >
                    </canvas>

                </div>

                <!-- =========================
                     EXERCISE STATUS
                ========================== -->
                <div class="report-card doughnut-card">

                    <h2>
                        Exercise Status
                    </h2>

                    <canvas
                        id="exerciseStatusChart"
                    >
                    </canvas>

                </div>

            </div>

        </section>
    `;

    /*GRADE EVOLUTION*/

    const evolutionLabels =
        reportData.gradeEvolution.map(
            e => e.exercise
        );

    const evolutionGrades =
        reportData.gradeEvolution.map(
            e => e.grade
        );

    const evolutionCtx =
        document.getElementById(
            "gradeEvolutionChart"
        );

    new Chart(evolutionCtx, {

        type: "line",

        data: {

            labels:
                evolutionLabels,

            datasets: [{

                label:
                    "Grade",

                data:
                    evolutionGrades,

                borderColor:
                    "#5b4dff",

                backgroundColor:
                    "#5b4dff",

                borderWidth: 4,

                tension: 0.4,

                fill: false,

                pointRadius: 6,

                pointHoverRadius: 8,

                pointBackgroundColor:
                    "#5b4dff",

                pointBorderColor:
                    "#ffffff",

                pointBorderWidth: 3
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }
            },

            scales: {

                y: {

                    beginAtZero: true,

                    max: 100,

                    ticks: {
                        stepSize: 1
                    },

                    grid: {
                        color: "#e5e7eb"
                    }
                },

                x: {

                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    /*GRADES BY COURSE */

    const courseLabels =
        reportData.gradesByCourse.map(
            c => c.course
        );

    const courseGrades =
        reportData.gradesByCourse.map(
            c => c.average
        );

    const courseCtx =
        document.getElementById(
            "gradesByCourseChart"
        );

    new Chart(courseCtx, {

        type: "bar",

        data: {

            labels:
                courseLabels,

            datasets: [{

                label:
                    "Average",

                data:
                    courseGrades,

                backgroundColor:
                    "#10b981",

                borderRadius: 12,

                hoverBackgroundColor:
                    "#059669"
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }
            },

            scales: {

                y: {

                    beginAtZero: true,

                    max: 100,

                    ticks: {
                        stepSize: 1
                    },

                    grid: {
                        color: "#e5e7eb"
                    }
                },

                x: {

                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    /*EXERCISE STATUS*/

    const statusCtx =
        document.getElementById(
            "exerciseStatusChart"
        );

    new Chart(statusCtx, {

        type: "doughnut",

        data: {

            labels: [
                "Completed",
                "Processing",
                "Error"
            ],

            datasets: [{

                data: [

                    reportData.statusData.completed,
                    reportData.statusData.submitted,
                    reportData.statusData.pending
                ],

                backgroundColor: [

                    "#10b981",
                    "#ab0bf5",
                    "#ef4444"
                ],

                borderWidth: 0
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "70%",

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        padding: 20,

                        boxWidth: 14,

                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

/* REPORTS TEACHER */
export async function renderTeacherReports(reportData)
{
    const main =
        document.querySelector(".content");

    main.innerHTML = `

        <section class="reports-section">

            <div class="reports-header">

                <h1>
                    Analytics & Reports
                </h1>

                <p>
                    Platform and course performance metrics.
                </p>

            </div>

            <div class="reports-grid">

                <!-- =========================
                     SUBMISSIONS CHART
                ========================== -->
                <div class="report-card">

                    <h2>
                        Average Grade per Course
                    </h2>

                    <canvas
                        id="submissionsChart"
                    >
                    </canvas>

                </div>

                <!-- =========================
                     PASS RATE CHART
                ========================== -->
                <div class="report-card">

                    <h2>
                        Course Pass Rates (%)
                    </h2>

                    <canvas
                        id="passRateChart"
                    >
                    </canvas>

                </div>

            </div>

        </section>

    `;

    const labels =reportData.map(c => c.course);
    const averageGrades =reportData.map(c => c.averageGrade);
    const passRates =reportData.map(c => c.passRate);
    const submissionsCtx =document.getElementById("submissionsChart");

    new Chart(submissionsCtx, {

        type: "bar",

        data: {

            labels,

            datasets: [{

                label:
                    "Average Grade",

                data:
                    averageGrades,

                backgroundColor:
                    "#5b4dff",

                borderRadius:
                    12,

                hoverBackgroundColor:
                    "#4338ca"

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    callbacks: {

                        label: function(context)
                        {
                            return (
                                context.raw +
                                "/100 average"
                            );
                        }

                    }

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    max: 100,

                    ticks: {
                        stepSize: 1
                    },

                    grid: {
                        color: "#e5e7eb"
                    }

                },

                x: {

                    grid: {
                        display: false
                    }

                }

            }

        }

    });

    const passRateCtx =
        document.getElementById(
            "passRateChart"
        );

    new Chart(passRateCtx, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label:
                    "Pass Rate",

                data:
                    passRates,

                borderColor:
                    "#10b981",

                backgroundColor:
                    "#10b981",

                borderWidth: 4,

                tension: 0.4,

                fill: false,

                pointRadius: 6,

                pointHoverRadius: 8,

                pointBackgroundColor:
                    "#10b981",

                pointBorderColor:
                    "#ffffff",

                pointBorderWidth: 3

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    callbacks: {

                        label: function(context)
                        {
                            return (
                                context.raw +
                                "% pass rate"
                            );
                        }

                    }

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    max: 100,

                    ticks: {

                        callback:
                            value => value + "%"

                    },

                    grid: {
                        color: "#e5e7eb"
                    }

                },

                x: {

                    grid: {
                        display: false
                    }

                }

            }

        }

    });
}

export async function renderCourseExercises(ejercicios, subjectName, from, offeringId, unreadCount = 0, rol, subjectId = null) {
    const main = document.querySelector(".content");
    main.innerHTML = "";

    // HEADER (sin cambios)
    const header = document.createElement("div");
    header.classList.add("course-exercises-header");
    const rankingSubjectId = subjectId || offeringId;
    header.innerHTML = `
        <div class="header-top-row">
            <button class="back-btn" data-back="${from}" data-offeringid="${offeringId}">
                <span class="back-icon">←</span>
                <span>Back to ${from === "dashboard" ? "Dashboard" : "Subjects"}</span>
            </button>
            <div class="header-top-actions">
                <button class="ranking-btn" data-subjectid="${rankingSubjectId}" data-subjectname="${subjectName}">
                    🏆 View Ranking
                </button>
                ${(rol === "teacher"  || rol === "admin") ? `
                    <button class="create-exercise-btn" id="createExerciseFromCourseBtn" data-offeringid="${offeringId}">
                        + Create Exercise
                    </button>
                ` : ""}
            </div>
        </div>
        <div class="course-info">
            <div class="course-icon2">
                <img src="src/img/courses.png" class="course-icon-img">
            </div>
            <div>
                <h1 class="course-title-page">${escapeHtmlContent(subjectName)}</h1>
                <p class="course-subtitle-page">Complete your assigned exercises</p>
            </div>
        </div>
    `;
    main.appendChild(header);
    
    // TABS (sin cambios)
    const tabs = document.createElement("div");
    tabs.classList.add("course-tabs");
    let messagesTabHTML = '';
    if (rol !== "admin") {
        messagesTabHTML = `
            <button class="course-tab messages-tab-btn" data-offeringid="${offeringId}">
                <i class="fa-regular fa-message"></i> Messages
                ${unreadCount > 0 ? `<span class="message-badge">${unreadCount}</span>` : ""}
            </button>
        `;
    }
    tabs.innerHTML = `
        <button class="course-tab exercises-tab-btn active" data-offeringid="${offeringId}">
            <i class="fa-regular fa-book-open"></i> Exercises
        </button>
        ${messagesTabHTML}
        <button class="course-tab students-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-users"></i> Students
        </button>
        <button class="course-tab professors-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-chalkboard-user"></i> Professors
        </button>
    `;
    main.appendChild(tabs);

    // AGRUPACIÓN (sin cambios)
    const today = new Date();
    const closed = [];
    const openWithDeadline = [];
    const noDeadline = [];

    ejercicios.forEach(exercise => {
        const isVisible = exercise.visibility === true;
        if (rol === "student" && !isVisible) return;
        const hasDeadline = exercise.deadline && exercise.deadline !== "null";
        const deadline = hasDeadline ? new Date(exercise.deadline) : null;
        const isClosed = hasDeadline ? deadline < today : false;
        if (isClosed) {
            closed.push(exercise);
        } else if (hasDeadline) {
            openWithDeadline.push(exercise);
        } else {
            noDeadline.push(exercise);
        }
    });

    const sortByDeadline = (a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    };
    openWithDeadline.sort(sortByDeadline);
    closed.sort(sortByDeadline);

    const renderGroupTable = (title, exercises, icon, groupClass) => {
        if (exercises.length === 0) return "";
        
        let rows = "";
        exercises.forEach(exercise => {
            const isVisible = exercise.visibility === true;
            const isClosed = exercise.deadline && new Date(exercise.deadline) < new Date();
            let badgeHTML = isClosed
                ? `<span class="badge expired">Closed</span>`
                : `<span class="badge pending">Open</span>`;

            let statusCellHTML = `<div class="badge-cell">${badgeHTML}`;
            if (rol === "teacher" || rol === "admin") {
                const visibilityText = isVisible ? 'Visible' : 'Hidden';
                const visibilityClass = isVisible ? 'visible' : 'is-hidden';
                statusCellHTML += `<span class="visibility-badge ${visibilityClass}">${visibilityText}</span>`;
            }
            statusCellHTML += `</div>`;

            let actionHTML = "";
            if (rol === "student") {
                if (!isClosed) {
                    actionHTML += `<button class="primary-btn start-coding-btn" data-id="${exercise.id}" data-courseid="${offeringId}">Start Coding</button>`;
                }
                if (exercise.submissions?.length > 0) {
                    actionHTML += `<button class="view-btn submissions-btn" data-id="${exercise.id}" data-from="course-exercises" data-subjectid="${offeringId}">View Submissions (${exercise.submissions.length})</button>`;
                } else if (isClosed && (!exercise.submissions || exercise.submissions.length === 0)) {
                    actionHTML += `<button class="disabled-btn" disabled>No Submissions</button>`;
                }
            } else if (rol === "teacher" || rol === "admin") {
                actionHTML = `
                    <button class="primary-btn start-coding-btn" data-id="${exercise.id}" data-courseid="${offeringId}">Start Coding</button>
                    <button class="view-btn edit-exercise-btn" data-id="${exercise.id}">Edit</button>
                    <button class="duplicate-exercise-btn-icon" data-id="${exercise.id}" data-title="${escapeHtmlContent(exercise.title)}" title="Duplicate exercise">
                        <img src="src/img/copiar.png" class="duplicate-icon" alt="Duplicate">
                        <span class="duplicate-text">Duplicate</span>
                    </button>
                    <button class="view-btn submissions-btn" data-id="${exercise.id}" data-from="course-exercises" data-subjectid="${offeringId}">View Submissions</button>
                `;
                // Botón eliminar solo para admin
                if (rol === "admin") {
                    actionHTML += `<button class="delete-exercise-btn" data-id="${exercise.id}" data-title="${escapeHtmlContent(exercise.title)}" title="Delete exercise">🗑️ Delete</button>`;
                }
            }
            rows += `
                <tr>
                    <td class="exercise-name-cell">
                        <div class="exercise-name">${escapeHtmlContent(exercise.title)}</div>
                    </td>
                    <td class="deadline-cell">${exercise.deadline ? formatDate(exercise.deadline) : "No deadline"}</td>
                    <td class="status-cell">${statusCellHTML}</td>
                    <td class="actions-cell">
                        <div class="exercise-actions">${actionHTML}</div>
                    </td>
                </tr>
            `;
        });

        return `
            <div class="exercise-group ${groupClass}">
                <div class="group-header">
                    <span class="group-icon">${icon}</span>
                    <h2 class="group-title">${title} (${exercises.length})</h2>
                </div>
                <table class="course-exercises-table">
                    <thead>
                        <tr>
                            <th>Exercise</th>
                            <th>Deadline</th>
                            <th>Status / Visibility</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    };

    const groupsContainer = document.createElement("div");
    groupsContainer.classList.add("course-exercises-groups");

    let groupsHTML = "";
    groupsHTML += renderGroupTable("Upcoming Deadlines", openWithDeadline, "⏳", "upcoming-group");
    groupsHTML += renderGroupTable("No Deadline", noDeadline, "🔄", "nodeadline-group");
    groupsHTML += renderGroupTable("Closed Exercises", closed, "📅", "closed-group");

    if (groupsHTML === "") {
        groupsContainer.innerHTML = `
            <div class="empty-exercises-message">
                <p>No exercises available for this subject yet.</p>
                ${ejercicios.length > 0 ? '<p class="hint">Some exercises may be hidden by your professor.</p>' : ''}
            </div>
        `;
    } else {
        groupsContainer.innerHTML = groupsHTML;
    }

    main.appendChild(groupsContainer);
}
function generateDynamicTemplate(language, args, returnType = "any") {
    // Mapeo de tipos de argumento a tipos de lenguaje
    // Actualizar el typeMap al inicio de generateDynamicTemplate

const typeMap = {
    'int': { python: 'int', cpp: 'int', java: 'int', js: 'number' },
    'float': { python: 'float', cpp: 'double', java: 'double', js: 'number' },
    'str': { python: 'str', cpp: 'string', java: 'String', js: 'string' },
    'bool': { python: 'bool', cpp: 'bool', java: 'boolean', js: 'boolean' },
    'list_int': { python: 'List[int]', cpp: 'vector<int>', java: 'List<Integer>', js: 'number[]' },
    'list_str': { python: 'List[str]', cpp: 'vector<string>', java: 'List<String>', js: 'string[]' },
    'list_float': { python: 'List[float]', cpp: 'vector<double>', java: 'List<Double>', js: 'number[]' },
    'dict': { python: 'Dict', cpp: 'map<string, any>', java: 'Map<String, Object>', js: 'Object' },
    'TreeNode': { python: 'TreeNode', cpp: 'TreeNode*', java: 'TreeNode', js: 'TreeNode' },
    'ListNode': { python: 'ListNode', cpp: 'ListNode*', java: 'ListNode', js: 'ListNode' },
    'GraphNode': { python: 'GraphNode', cpp: 'GraphNode*', java: 'GraphNode', js: 'GraphNode' },
    'NaryTreeNode': { python: 'NaryTreeNode', cpp: 'NaryTreeNode*', java: 'NaryTreeNode', js: 'NaryTreeNode' },
    'DoublyListNode': { python: 'DoublyListNode', cpp: 'DoublyListNode*', java: 'DoublyListNode', js: 'DoublyListNode' }
};
    
    const returnTypeMap = {
        'int': { python: 'int', cpp: 'int', java: 'int', js: 'number' },
        'float': { python: 'float', cpp: 'double', java: 'double', js: 'number' },
        'str': { python: 'str', cpp: 'string', java: 'String', js: 'string' },
        'bool': { python: 'bool', cpp: 'bool', java: 'boolean', js: 'boolean' },
        'list_int': { python: 'List[int]', cpp: 'vector<int>', java: 'List<Integer>', js: 'number[]' },
        'list_str': { python: 'List[str]', cpp: 'vector<string>', java: 'List<String>', js: 'string[]' },
        'void': { python: 'None', cpp: 'void', java: 'void', js: 'undefined' },
        'TreeNode': { python: 'TreeNode', cpp: 'TreeNode*', java: 'TreeNode', js: 'TreeNode' },
        'ListNode': { python: 'ListNode', cpp: 'ListNode*', java: 'ListNode', js: 'ListNode' },
        'GraphNode': { python: 'GraphNode', cpp: 'GraphNode*', java: 'GraphNode', js: 'GraphNode' },
        'NaryTreeNode': { python: 'NaryTreeNode', cpp: 'NaryTreeNode*', java: 'NaryTreeNode', js: 'NaryTreeNode' },
        'DoublyListNode': { python: 'DoublyListNode', cpp: 'DoublyListNode*', java: 'DoublyListNode', js: 'DoublyListNode' }
};
    
    // Si no hay argumentos, usar plantilla simple
    if (!args || args.length === 0) {
        switch(language) {
            case 'python':
                return `def solution():
    # Write your code here
    pass`;
            case 'cpp':
                return `#include <iostream>
#include <string>
#include <vector>
#include <map>
using namespace std;

/**
 * TODO: Describe what this function does
 * @return Description of return value
 */
${returnTypeMap[returnType]?.cpp || 'int'} solution() {
    // Write your code here
    
    return ${returnType === 'void' ? '' : (returnTypeMap[returnType]?.cpp === 'int' ? '0' : returnTypeMap[returnType]?.cpp === 'string' ? '""' : returnTypeMap[returnType]?.cpp === 'bool' ? 'false' : '{}')};
}`;
            case 'java':
                return `public static ${returnTypeMap[returnType]?.java || 'int'} solution() {
    // Write your code here
    
    return ${returnType === 'void' ? '' : (returnTypeMap[returnType]?.java === 'int' ? '0' : returnTypeMap[returnType]?.java === 'String' ? '""' : returnTypeMap[returnType]?.java === 'boolean' ? 'false' : 'null')};
}`;
            default: // javascript
                return `function solution() {
    // Write your code here
    
    return null;
}`;
        }
    }
    
    // Generar parámetros para la firma de función
    const params = args.map(arg => arg.name).join(', ');
    const typedParams = args.map(arg => {
        const type = typeMap[arg.type_name]?.[language] || 'any';
        switch(language) {
            case 'cpp':
                return `${type} ${arg.name}`;
            case 'java':
                return `${type} ${arg.name}`;
            default:
                return arg.name;
        }
    }).join(', ');
    
    const returnTypeLang = returnTypeMap[returnType]?.[language] || (language === 'python' ? 'Any' : language === 'js' ? 'any' : 'int');
    
    switch(language) {
        case 'python':
            let pythonImports = [];
            const hasList = args.some(a => a.type_name.startsWith('list_'));
            const hasDict = args.some(a => a.type_name === 'dict');
            if (hasList) pythonImports.push('from typing import List');
            if (hasDict) pythonImports.push('from typing import Dict');
            const imports = pythonImports.length > 0 ? pythonImports.join('\n') + '\n\n' : '';
            return `${imports}def solution(${params}):
    """
    TODO: Describe what this function does
    ${args.map(arg => `    :param ${arg.name}: ${arg.description || 'Description of ' + arg.name}`).join('\n')}
    :return: ${returnType === 'void' ? 'None' : 'Description of return value'}
    """
    # Write your code here
    
    ${returnType === 'void' ? 'pass' : 'return None'}`;
            
        case 'cpp':
            return `#include <iostream>
#include <string>
#include <vector>
#include <map>
using namespace std;

/**
 * TODO: Describe what this function does
${args.map(arg => ` * @param ${arg.name} ${arg.description || ''}`).join('\n')}
 * @return ${returnType === 'void' ? 'void' : 'Description of return value'}
 */
${returnTypeLang} solution(${typedParams}) {
    // Write your code here
    
    ${returnType === 'void' ? 'return;' : 'return ' + (returnTypeLang === 'int' ? '0' : returnTypeLang === 'string' ? '""' : returnTypeLang === 'bool' ? 'false' : '{}') + ';'}
}`;
            
        case 'java':
            // Solo el método, sin clase envolvente
            return `public static ${returnTypeLang} solution(${typedParams}) {
    // Write your code here
    
    ${returnType === 'void' ? 'return;' : 'return ' + (returnTypeLang === 'int' ? '0' : returnTypeLang === 'String' ? '""' : returnTypeLang === 'boolean' ? 'false' : 'null') + ';'}
}`;
            
        default: // javascript
            return `/**
 * TODO: Describe what this function does
 ${args.map(arg => ` * @param {${typeMap[arg.type_name]?.js || 'any'}} ${arg.name} ${arg.description || ''}`).join('\n')}
 * @returns {${returnTypeMap[returnType]?.js || 'any'}} Description of return value
 */
function solution(${params}) {
    // Write your code here
    
    ${returnType === 'void' ? 'return;' : 'return null;'}
}`;
    }
}

/* Función para obtener el tipo de retorno del ejercicio (puedes añadirlo al schema) */
function getReturnType(exercise) {
    // Por ahora devolver 'any', pero idealmente deberías tener un campo return_type en Exercise
    return exercise.return_type || 'any';
}

function getBackButtonText(source) {
    switch (source) {
        case "dashboard":
            return "Back to Dashboard";
        case "course-exercises":
            return "Back to Course";
        case "teacher-test":
            return "Back to Exercises";
        default:
            return "Back to Exercises";
    }
}

export function renderCodingExercise(
    exercise,
    testCases = [],
    programmingLanguages = [],
    source,
    courseId,
    argumentsData = []
) {
    const main = document.querySelector(".content");
    
    // DEFAULT LANGUAGE
    const selectedLanguage =
        programmingLanguages.length > 0
            ? programmingLanguages[0]
            : {
                id: 1,
                name: "JavaScript",
                monaco_language: "javascript"
            };
    selectedLanguage.monaco_language =
        selectedLanguage.name.toLowerCase();

    // OBTENER TIPO DE RETORNO DEL EJERCICIO
    const returnType = exercise.return_type || "any";

    // Guardar argumentos y tipo de retorno en caché global
    setCurrentExerciseArguments(argumentsData, returnType);
    if (typeof window !== 'undefined') {
        window.currentArgumentsCache = argumentsData;
        window.currentReturnTypeCache = returnType;
    }

    // Determinar si usar plantilla con argumentos (SOLO si es function_calls y hay argumentos)
    const isFunctionCalls = exercise.evaluation_mode === "function_calls";
    const hasArguments = argumentsData && argumentsData.length > 0;
    
    let template = "";
    
    if (isFunctionCalls && hasArguments) {
        // Generar plantilla dinámica con los argumentos y return type
        template = generateDynamicTemplate(selectedLanguage.monaco_language, argumentsData, returnType);
    } else {
        // Usar plantilla por defecto (modo legacy_stdin o sin argumentos)
        template = getDefaultTemplate(selectedLanguage.monaco_language, returnType);
    }

    // LANGUAGE SELECTOR HTML
    let languageSelectorHTML = "";
    if (programmingLanguages.length > 1) {
        languageSelectorHTML = `
            <select class="language-selector" id="language-selector">
                ${programmingLanguages.map(lang => `
                    <option 
                        value="${lang.name.toLowerCase()}"
                        data-language-id="${lang.id}"
                        ${lang.id === selectedLanguage.id ? 'selected' : ''}
                    >
                        ${lang.name}
                    </option>
                `).join("")}
            </select>
        `;
    } else {
        languageSelectorHTML = `
            <div class="editor-lang">
                ${selectedLanguage.name.toUpperCase()}
            </div>
        `;
    }

    main.innerHTML = `
        <div class="coding-page">
            <!-- TOPBAR -->
            <div class="coding-topbar">
                <button 
                    class="back-btn"
                    data-back="${source}"
                    data-courseid="${courseId || exercise.course_offering_id}"
                >
                    <span class="back-icon">←</span>
                    <span>${getBackButtonText(source)}</span>
                </button>
                <div class="top-actions">
                    <div class="deadline-box">
                        ⏰ Due: ${formatDate(exercise.deadline) || "No deadline"}
                    </div>
                    <button class="run-btn" data-id="${exercise.id}" data-language-id="${selectedLanguage.id}">
                        ▶ Run Tests
                    </button>
                    ${(localStorage.getItem("rol") === "student" && source !== "teacher-test") ? `
                        <button class="submit-btn" data-id="${exercise.id}" data-language-id="${selectedLanguage.id}">
                            Submit Solution
                        </button>
                    ` : ''}
                </div>
            </div>
            <h1 class="exercise-title">${exercise.title}</h1>
            <div class="coding-layout">
                <div class="exercise-panel">
                    <h3>Problem Description</h3>
                    <p class="exercise-description">${exercise.description || ""}</p>
                    
                    <!-- Mostrar información de la función si hay argumentos y es modo function_calls -->
                    ${(isFunctionCalls && hasArguments) ? `
                        <div class="function-signature-section">
                            <h3>Function Signature</h3>
                            <div class="function-signature">
                                <code>${generateSignaturePreview(selectedLanguage.monaco_language, argumentsData, returnType)}</code>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- TEST CASES SECTION -->
                    <div class="testcases-section">
                        <h3 class="testcases-title">Test Cases</h3>
                        ${testCases.length > 0 ? `
                            <div class="testcases-list">
                                ${testCases.map((testCase, index) => `
                                    <div class="testcase-card">
                                        <div class="testcase-header">Case #${index + 1}</div>
                                        <div class="testcase-body">
                                            <div class="testcase-row">
                                                <span class="label">Input:</span>
                                                <code>${formatDisplayValue(testCase.input_data)}</code>
                                            </div>
                                            <div class="testcase-row">
                                                <span class="label">Expected:</span>
                                                <code>${formatDisplayValue(testCase.expected_output)}</code>
                                            </div>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        ` : `<div class="no-testcases">No test cases available</div>`}
                    </div>
                </div>
                <div class="editor-wrapper">
                    <div class="editor-header">
                        <div class="editor-dots">
                            <div class="dot red"></div>
                            <div class="dot yellow"></div>
                            <div class="dot green"></div>
                        </div>
                        <div class="editor-file">
                            solution.${selectedLanguage.monaco_language === "python" ? "py" : 
                                      selectedLanguage.monaco_language === "cpp" ? "cpp" :
                                      selectedLanguage.monaco_language === "java" ? "java" : "js"}
                        </div>
                        ${languageSelectorHTML}
                    </div>
                    <div class="editor-panel">
                        <div id="monaco-editor"></div>
                    </div>
                    <div id="test-results" class="test-results hidden"></div>
                </div>
            </div>
        </div>
    `;

    // Crear editor con la plantilla generada
    if (currentEditor) {
        currentEditor.dispose();
    }
    
    currentEditor = monaco.editor.create(
        document.getElementById("monaco-editor"),
        {
            value: template,
            language: selectedLanguage.monaco_language || "javascript",
            theme: "vs-dark",
            automaticLayout: true,
            fontSize: 15,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            padding: { top: 20 }
        }
    );
    
    setTimeout(() => {
        currentEditor.layout();
        currentEditor.focus();
    }, 100);
}

/* Generar preview de la firma de función */
function generateSignaturePreview(language, args, returnType) {
    const params = args.map(arg => arg.name).join(', ');
    const returnTypeLabel = returnType === 'void' ? (language === 'python' ? 'None' : 'void') : 
                           (returnType === 'any' ? (language === 'python' ? 'Any' : language === 'js' ? 'any' : 'auto') : returnType);
    
    switch(language) {
        case 'python':
            return `def solution(${params}) -> ${returnTypeLabel}:`;
        case 'cpp':
            return `${returnTypeLabel === 'void' ? 'void' : returnTypeLabel} solution(${params});`;
        case 'java':
            return `public static ${returnTypeLabel === 'void' ? 'void' : returnTypeLabel} solution(${params})`;
        default:
            return `function solution(${params}) { ... }`;
    }
}
/* UPDATE EDITOR LANGUAGE*/
export function setCurrentExerciseArguments(argumentsData, returnType = 'any') {
    currentArgumentsCache = argumentsData || [];
    currentReturnTypeCache = returnType;
}

export function updateEditorLanguage(newLanguage, argumentsData = null, returnType = null) {
    if (!currentEditor) return;
    
    const args = argumentsData || currentArgumentsCache;
    const retType = returnType || currentReturnTypeCache;
    
    const langForTemplate = 
        newLanguage === "python" ? "python" :
        newLanguage === "cpp" ? "cpp" :
        newLanguage === "java" ? "java" : "javascript";
    
    const hasArguments = args && args.length > 0;
    
    let template;
    if (hasArguments) {
        template = generateDynamicTemplate(langForTemplate, args, retType);
    } else {
        template = getDefaultTemplate(langForTemplate, retType); // Necesitamos pasar retType también
    }
    
    monaco.editor.setModelLanguage(
        currentEditor.getModel(),
        newLanguage
    );
    
    currentEditor.setValue(template);
}

function getDefaultTemplate(language, returnType = 'any') {
    const returnTypeMap = {
        'int': { python: 'int', cpp: 'int', java: 'int', js: 'number' },
        'str': { python: 'str', cpp: 'string', java: 'String', js: 'string' },
        'bool': { python: 'bool', cpp: 'bool', java: 'boolean', js: 'boolean' },
        'void': { python: 'None', cpp: 'void', java: 'void', js: 'undefined' }
    };
    const ret = returnTypeMap[returnType]?.[language] || (language === 'python' ? 'Any' : language === 'js' ? 'any' : 'int');
    switch(language) {
        case 'python':
            return `def solution(input):
    # Write your code here
    
    return None`;
        case 'cpp':
            return `#include <iostream>
#include <string>
#include <vector>
#include <map>
using namespace std;

${ret} solution() {
    // Write your code here
    
    return ${ret === 'int' ? '0' : ret === 'string' ? '""' : ret === 'bool' ? 'false' : '{}'};
}`;
        case 'java':
            return `public static ${ret} solution() {
    // Write your code here
    
    return ${ret === 'int' ? '0' : ret === 'String' ? '""' : ret === 'boolean' ? 'false' : 'null'};
}`;
        default:
            return `function solution(input) {
    // Write your code here
    
    return null;
}`;
    }
}

export function handleLanguageChange(selector, argumentsData = null) {
    const newLanguage = selector.value;
    const selectedOption = selector.options[selector.selectedIndex];
    const languageId = selectedOption.dataset.languageId;
    
    updateEditorLanguage(newLanguage, argumentsData);
    updateEditorFileExtension(newLanguage);
    updateRunButtonLanguage(languageId);
}
/* GET EDITOR CODE */
export function getEditorCode()
{
    if (!currentEditor)
    {
        return "";
    }

    return currentEditor.getValue();
}

/* UPDATE FILE EXTENSION */
export function updateEditorFileExtension(newLanguage)
{
    const fileElement =
        document.querySelector(".editor-file");

    if (!fileElement)
    {
        return;
    }

    let extension = "txt";

    switch (newLanguage)
    {
        case "javascript":
            extension = "js";
            break;

        case "python":
            extension = "py";
            break;

        case "java":
            extension = "java";
            break;

        case "cpp":
            extension = "cpp";
            break;
    }

    fileElement.textContent =
        `solution.${extension}`;
}

export function updateRunButtonLanguage(languageId)
{
    const runBtn =document.querySelector(".run-btn");
    const submitBtn = document.querySelector(".submit-btn");
    if (runBtn)
    {
         runBtn.dataset.languageId =
        languageId;
    }
    if(submitBtn)
    {
        submitBtn.dataset.languageId =
        languageId;
    }
}

export async function renderUserMenu(user, rol) {
    const oldMenu = document.querySelector(".user-menu");
    if (oldMenu) {
        oldMenu.remove();
        return;
    }

    const userDiv = document.querySelector(".user");
    const menu = document.createElement("div");
    menu.classList.add("user-menu");

    menu.innerHTML = `
        <div class="user-menu-header">
            <div class="user-avatar-large">
                ${user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div class="user-menu-info">
                <h3>${user.name || "Unknown User"}</h3>
                <p>${user.email || "No email"}</p>
                <span class="role-tag ${rol}">${rol.toUpperCase()}</span>
            </div>
        </div>
        <div class="user-menu-divider"></div>
        <button class="my-profile-btn">
            <span>👤</span>
            <span>My Profile</span>
        </button>
        <button class="logout-btn">
            <span>↪</span>
            <span>Sign out</span>
        </button>
    `;

    userDiv.appendChild(menu);
}


/* RENDER LOGOUT MODAL */
export async function renderLogoutModal()
{
    // ELIMINAR USER MENU
    const userMenu =document.querySelector(".user-menu");
    if (userMenu)
    {
        userMenu.remove();
    }

    // EVITAR DUPLICADOS
    const oldModal =document.querySelector(".logout-overlay");
    if (oldModal)
    {
        oldModal.remove();
    }
    const overlay =document.createElement("div");
    overlay.classList.add("logout-overlay");

    overlay.innerHTML = `

        <div class="logout-modal">

            <div class="logout-modal-header">

                <h2>
                    Confirm Logout
                </h2>

                <button class="close-logout-modal">
                    ×
                </button>

            </div>

            <div class="logout-modal-body">

                <p>
                    Are you sure you want to
                    log out?
                </p>

            </div>

            <div class="logout-modal-footer">

                <button class="cancel-logout-btn">
                    Cancel
                </button>

                <button class="confirm-logout-btn">
                    Log out
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);
}


/* CLOSE LOGOUT MODAL */
export async function closeLogoutModal()
{
    const overlay =
        document.querySelector(
            ".logout-overlay"
        );

    if (overlay)
    {
        overlay.remove();
    }
}

/* TEST RESULTS */
export function renderTestResults(results)
{
    const container =
        document.getElementById("test-results");

    if (!container) return;

    container.classList.remove("hidden");

    const passed =
        results.passed_tests || 0;

    const total =
        results.total_tests || 0;

    const failed =
        total - passed;

    container.innerHTML = `

    <div class="results-top">

        <div class="results-title">
            ▶ Test Results
        </div>

        <div class="results-badges">

            <span class="badge-pass">
                ${passed} Passed
            </span>

            <span class="badge-fail">
                ${failed} Failed
            </span>

        </div>

    </div>


    ${(results.test_results || []).map((test,index)=>`

        <div class="result-row">

            <div class="result-left">

                <span class="${
                    test.passed
                    ? "icon-pass"
                    : "icon-fail"
                }">

                    ${
                        test.passed
                        ? "✔"
                        : "✖"
                    }

                </span>

                Test ${index+1}

            </div>

            <div class="time">

                ${((test.execution_time)||0).toFixed(0)} ms

            </div>

        </div>


        ${
            !test.passed
            ?
            `
            <div class="result-error">

                <div style="margin-bottom: 4px;">
                    <strong>Expected:</strong>
                    <pre style="margin:4px 0 8px 0; white-space:pre-wrap; font-family:monospace; background:#f5f5f5; padding:8px; border-radius:4px;">${formatDisplayValue(test.expected_output)}</pre>
                </div>

                <div>
                    <strong>Output:</strong>
                    <pre style="margin:4px 0 8px 0; white-space:pre-wrap; font-family:monospace; background:#f5f5f5; padding:8px; border-radius:4px;">${formatDisplayValue(test.actual_output || "-")}</pre>
                </div>

                ${
                    test.error
                    ?
                    `<div><strong>Error:</strong><br><pre style="margin:4px 0 0 0; white-space:pre-wrap;">${escapeHtmlContent(test.error)}</pre></div>`
                    :
                    ""
                }

            </div>
            `
            :
            ""
        }

    `).join("")}


    <div class="preview-note">

        Preview only:
        results don't affect final score.

    </div>

    `;
}

function formatDisplayValue(value) {
    if (value === null || value === undefined) return "N/A";
    
    // Si ya es un objeto o array, serializar a JSON con formato legible
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch(e) {
            return String(value);
        }
    }
    
    // Si es string pero parece JSON, intentar parsear y mostrar bonito
    if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return value;
        }
    }
    
    return String(value);
}

function formatInputValue(value) {
    if (value === null || value === undefined) return "N/A";
    
    // Para objetos o arrays, serializar a JSON bonito
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch(e) {
            return String(value);
        }
    }
    
    // Si es string que parece JSON, parsear y mostrar
    if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return value;
        }
    }
    
    return String(value);
}

// Función auxiliar para formatear valores simples
function formatValueSimple(value) {
    if (value === null || value === undefined) return "null";
    
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch(e) {
            return String(value);
        }
    }
    
    return String(value);
}

/* SUBMISSION REPORT VIEW */
export function renderSubmissionReportView(
    submission,
    evaluation,
    testResults,
    exercise,
    testcases,
    pdfStatus,
    from = "submissions"  
)
{
    const main = document.querySelector(".content");

    const passedTests = testResults.filter(t => t.passed).length;

    // Determinar texto y data-back según el origen
    let backText = "Back to Submissions";
    let backTarget = "submissions";
    if (from === "dashboard") {
    backText = "Back to Dashboard";
    backTarget = "dashboard";
    }
    else if (from === "exercises") {
        backText = "Back to Exercises";
        backTarget = "exercises";
    } else if (from === "course-exercises") {
        backText = "Back to Course";
        backTarget = "course-exercises";
    } else if (from === "exercise-submissions") {
        backText = "Back to Submissions List";
        backTarget = "exercise-submissions";
    } else {
        backText = "Back to Submissions";
        backTarget = "submissions";
    }

    main.innerHTML = `
        <div class="submission-report">

            <!-- TOP -->
            <div class="report-top">

                <!-- HEADER -->
                <div class="submission-header">

                    <button class="back-btn" 
                        data-back="${backTarget}" 
                        data-submission-id="${submission.id}"
                        data-exercise-id="${exercise.id}"
                        data-subjectid="${exercise.course_offering_id}">
                        ← ${backText}
                    </button>

                    <h1>
                        Submission Result
                    </h1>

                    <p>
                        ${exercise?.title || "Exercise"}
                    </p>

                    <!-- PDF REPORT -->

                    ${
                        pdfStatus?.available
                        ?
                        `
                            <div class="pdf-report-card compact">

                                <div class="pdf-report-left">

                                    <div class="pdf-icon">
                                        📄
                                    </div>

                                    <div class="pdf-info">

                                        <h3>
                                            AI Feedback Report
                                        </h3>

                                        <p>
                                            Download detailed analysis
                                        </p>

                                    </div>

                                </div>

                                <button
                                    class="download-pdf-btn"
                                    data-submission-id="${submission.id}"
                                >
                                    Download PDF
                                </button>

                            </div>
                        `
                        :
                        `
                            <div class="pdf-report-card compact">

                                <div class="pdf-report-left">

                                    <div class="pdf-icon">
                                        🤖
                                    </div>

                                    <div class="pdf-info">

                                        <h3>
                                            AI Feedback Report
                                        </h3>

                                        <p>
                                            Generating report...
                                        </p>

                                    </div>

                                </div>

                                <div class="pdf-processing">
                                    Processing...
                                </div>

                            </div>
                        `
                    }

                </div>

                <!-- SCORE -->
                <div class="report-card2 score-card">

                    <span class="score-label">
                        FINAL SCORE
                    </span>

                    <div class="score-number">
                        ${Math.round(evaluation.score)}
                        <span>/100</span>
                    </div>

                    <div class="
                        score-pill
                        ${evaluation.score >= 70
                            ? "pill-pass"
                            : "pill-fail"}
                    ">
                        ${
                            `${passedTests}/${evaluation.total_tests} Tests Passed`
                        }
                    </div>

                </div>

            </div>

            <!-- MAIN -->
            <div class="report-main">

                <!-- LEFT -->
                <div class="submission-left">

                    <!-- TESTS -->
                    <div class="report-card2 tests-card">

                        <div class="card-header2">

                            <h2>
                                Test Cases
                            </h2>

                            <span class="tests-counter">
                                ${passedTests}/${evaluation.total_tests} Passed
                            </span>

                        </div>

                        <div class="tests-list">

                            ${
                                testResults.map((test,index) => {

                                    const testcase =
                                        testcases?.[index];

                                    return `
                                        <div class="test-item">

                                            <div class="test-top">

                                                <div class="test-title">
                                                    Test ${index + 1}
                                                </div>

                                                <div class="
                                                    test-status
                                                    ${test.passed
                                                        ? "test-pass"
                                                        : "test-fail"}
                                                ">
                                                    ${
                                                        test.passed
                                                        ? "Passed"
                                                        : "Failed"
                                                    }
                                                </div>

                                            </div>

                                            <div class="test-grid">

                                                <div class="test-block">
                                                <span>Input</span>
                                                <code>
                                                <pre style="margin: 0; font-family: inherit; white-space: pre-wrap; word-break: break-all; font-size: 12px;">${formatInputValue(testcase?.input_data)}</pre>
                                                </code>
                                                </div>

                                                <div class="test-block">

                                                    <span>
                                                        Expected Output
                                                    </span>

                                                    <code>
                                                        ${
                                                            testcase?.expected_output
                                                            || "N/A"
                                                        }
                                                    </code>

                                                </div>

                                                <div class="test-block">

                                                    <span>
                                                        Your Output
                                                    </span>

                                                    <code>
                                                        ${
                                                            test.actual_output
                                                            || "N/A"
                                                        }
                                                    </code>

                                                </div>

                                            </div>

                                            ${
                                                test.error
                                                ? `
                                                    <div class="test-error">
                                                        ${test.error}
                                                    </div>
                                                `
                                                : ""
                                            }

                                        </div>
                                    `;
                                }).join("")
                            }

                        </div>

                    </div>

                    <!-- CODE SECTION (nuevo) -->
                    <div class="report-card2 code-card">
                        <div class="card-header2">
                            <h2>Submitted Code</h2>
                            ${submission.code ? `<button class="copy-code-btn" data-code="${escapeHtmlContent(submission.code)}">📋 Copy</button>` : ''}
                        </div>
                        ${submission.code ? `<pre class="code-block"><code>${escapeHtmlContent(submission.code)}</code></pre>` : '<p class="no-code">No code available for this submission.</p>'}
                    </div>

                </div>

                <!-- RIGHT -->
                <div class="submission-right">

                    <!-- FEEDBACK -->
                    <div class="report-card2 feedback-card">

                        <div class="card-header2">

                            <h2>
                                AI Feedback
                            </h2>

                            <span class="feedback-badge">
                                ${
                                    evaluation.score >= 70
                                    ? "Good Job"
                                    : "Needs Improvement"
                                }
                            </span>

                        </div>

                        <div class="feedback-summary">

                            ${evaluation.feedback}

                        </div>

                        <div class="rubric-list">

                            ${
                                evaluation.rubric_scores?.map(rubric => `

                                    <div class="rubric-item">

                                        <div class="rubric-header">

                                            <span>
                                                ${rubric.name}
                                            </span>

                                            <span class="
                                                rubric-score
                                                ${
                                                    rubric.score >= 7
                                                    ? "score-good"
                                                    : "score-bad"
                                                }
                                            ">
                                                ${rubric.score}/10
                                            </span>

                                        </div>

                                        <p>
                                            ${rubric.comment}
                                        </p>

                                    </div>

                                `).join("")
                            }

                        </div>

                    </div>

                </div>

            </div>

        </div>
    `;

    setActiveMenu(3);
}

/* EXERCISE SUBMISSIONS */
export function renderExerciseSubmissions(
    submissions,
    exercise,
    courses,
    courses_offering,
    evaluations = [],
    from = "exercises",
    subjectId = null,
    rol = null
)
{
    const main = document.querySelector(".content");

    /* COURSE OFFERING */
    const courseOffering =
        courses_offering.find(
            co => co.id == exercise?.course_offering_id
        );

    /* COURSE / SUBJECT */
    const course =
        courses.find(
            c => c.id == courseOffering?.subject_id
        );

    /* EVALUATION MAP */
    const evaluationMap = {};

    evaluations.forEach(ev => {
        evaluationMap[ev.submission_id] = ev;
    });

    // Determinar el título según el rol - AHORA CON EL NOMBRE DEL EJERCICIO
    const title = (rol === "teacher" || rol === "admin")
        ? `Submissions: ${exercise?.title || "Exercise"}` 
        : `My Submissions: ${exercise?.title || "Exercise"}`;
    
    const subtitle = (rol === "teacher" || rol === "admin")
        ? `Review all student submissions and evaluation results for "${exercise?.title || "this exercise"}".`
        : `Review all your submissions and evaluation results for "${exercise?.title || "this exercise"}".`;

    let backText = "Back to Exercises";
    if (from === "submissions") backText = "Back to Submissions";
    else if (from === "course-exercises") backText = "Back to Course";
    else if (from === "dashboard") backText = "Back to Dashboard";
    else backText = "Back to Exercises";
    main.innerHTML = `
        <div class="exercise-submissions-page">
            <!-- HEADER TOP -->
            <div class="exercise-submissions-header-top">
                <button class="back-btn" data-back="${from}" data-subjectid="${subjectId || ""}" data-courseid="${courseOffering?.subject_id || subjectId || ""}">
                    ← ${backText}
                </button>
            </div>

            <!-- HEADER -->
            <div class="exercise-submissions-header">
                <div>
                    <h1>${title}</h1>
                    <p class="exercise-submissions-subtitle">${subtitle}</p>
                </div>
            </div>

            <!-- TABLE -->
            <table class="submissions-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        ${rol === "teacher" || rol === "admin" ? "<th>STUDENT</th>" : ""}
                        <th>EXERCISE</th>
                        <th>COURSE</th>
                        <th>SCORE</th>
                        <th>STATUS</th>
                        <th>DATE</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                        submissions.length === 0
                        ? `
                            <tr>
                                <td colspan="${rol === "teacher"  ? 8 : 7}" style="text-align: center;">
                                    No submissions yet
                                </td>
                            </tr>
                        `
                        : submissions.map(sub => {
                            const evaluation = evaluationMap[sub.id];
                            const score = evaluation ? `${Math.round(evaluation.score)}/100` : "-";
                            const status = evaluation ? "evaluated" : "processing";
                            const buttonDisabled = evaluation ? "" : "disabled";

                            return `
                                <tr>
                                    <td>#${sub.id}</td>
                                    ${rol === "teacher" || rol === "admin" ?  `<td>${sub.student_name || "Unknown Student"}</td>` : ""}
                                    <td><div class="exercise-name">${exercise?.title || "Unknown"}</div></td>
                                    <td><div class="exercise-sub2">${course?.name || "Unknown"}</div></td>
                                    <td>${score}</td>
                                    <td><span class="badge ${status}">${status}</span></td>
                                    <td>${formatDate(sub.submitted_at)}</td>
                                    <td>
                                        <button class="view-btn" data-submission-id="${sub.id}" data-from="exercise-submissions" data-exercise-id="${exercise.id}" ${buttonDisabled}>
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join("")
                    }
                </tbody>
            </table>
        </div>
    `;
}
/* RENDER FILTER SUBMISSIONS */
export function renderSubmissionFilters(
    filters = {},
    filterOptions = {}
)
{
    /* EVITAR DUPLICADOS */
    const existingPanel =
        document.querySelector("#filtersPanel");

    if (existingPanel)
    {
        existingPanel.classList.toggle("hidden");
        return;
    }

    const {
        statuses = [],
        languages = [],
        subjects = [],
        exercises = [],
        students = []
    } = filterOptions;

    const submissionsActions =
        document.querySelector(".submissions-actions");

    const filtersContainer =
        document.createElement("div");

    filtersContainer.id = "filtersPanel";

    filtersContainer.classList.add("filters-panel");

    filtersContainer.innerHTML = `

        <div class="filter-group">

            <label>Status</label>

            <select id="filterStatus">
                <option value="">All Status</option>
                ${statuses
                    .filter(status => status !== "pending")
                    .map(status => `
                        <option
                            value="${status}"
                            ${filters.status === status ? "selected" : ""}
                        >
                            ${status}
                        </option>
                    `).join("")}
            </select>

        </div>

        <div class="filter-group">

            <label>Language</label>

            <select id="filterLanguage">

                <option value="">
                    All Languages
                </option>

                ${
                    languages.map(lang => `
                        <option
                            value="${lang.name}"
                            ${
                                filters.language === lang.name
                                ? "selected"
                                : ""
                            }
                        >
                            ${lang.name} ${lang.version}
                        </option>
                    `).join("")
                }

            </select>

        </div>

        <div class="filter-group">

            <label>Student Name</label>

            <input
                type="text"
                id="filterStudentName"
                placeholder="Search student..."
                value="${escapeHtmlContent(filters.studentName || "")}"
            >

        </div>

        <div class="filter-group">

            <label>Subject</label>

            <select id="filterSubject">

                <option value="">
                    All Subjects
                </option>

                ${
                    subjects.map(subj => `
                        <option
                            value="${subj.id}"
                            ${
                                filters.subjectId == subj.id
                                ? "selected"
                                : ""
                            }
                        >
                            ${escapeHtmlContent(subj.name)}
                        </option>
                    `).join("")
                }

            </select>

        </div>

        <div class="filter-group">

            <label>Min Score</label>

            <input
                type="number"
                id="filterMinScore"
                min="0"
                max="100"
                value="${filters.minScore || ""}"
            >

        </div>

        <div class="filter-group">

            <label>Max Score</label>

            <input
                type="number"
                id="filterMaxScore"
                min="0"
                max="100"
                value="${filters.maxScore || ""}"
            >

        </div>

        <div class="filter-group">

            <label>Passed</label>

            <select id="filterPassed">

                <option value="">
                    All
                </option>

                <option value="true" ${filters.passed === true || filters.passed === "true" ? "selected" : ""}>
                    Passed (≥60%)
                </option>

                <option value="false" ${filters.passed === false || filters.passed === "false" ? "selected" : ""}>
                    Failed (<60%)
                </option>

            </select>

        </div>

        <div class="filter-group">

            <label>Date From</label>

            <input
                type="date"
                id="filterDateFrom"
                value="${filters.dateFrom || ""}"
            >

        </div>

        <div class="filter-group">

            <label>Date To</label>

            <input
                type="date"
                id="filterDateTo"
                value="${filters.dateTo || ""}"
            >

        </div>

        <div class="filter-actions">

            <button
                class="primary-btn2"
                id="applySubmissionFilters"
            >
                Apply Filters
            </button>

            <button
                class="secondary-btn"
                id="clearFiltersBtn"
                style="margin-left: 10px;"
            >
                Clear Filters
            </button>

            <button
                class="secondary-btn"
                id="exportSubmissionsBtn"
                style="margin-left: 10px;"
            >
                📥 Export to CSV
            </button>

        </div>
    `;

    submissionsActions.insertAdjacentElement(
        "afterend",
        filtersContainer
    );
}

export function getFilterValues() 
{
    let passedValue = document.getElementById("filterPassed")?.value || "";
    
    return {
        status: document.getElementById("filterStatus")?.value || "",
        language: document.getElementById("filterLanguage")?.value || "",
        minScore: document.getElementById("filterMinScore")?.value || "",
        maxScore: document.getElementById("filterMaxScore")?.value || "",
        dateFrom: document.getElementById("filterDateFrom")?.value || "",
        dateTo: document.getElementById("filterDateTo")?.value || "",
        studentName: document.getElementById("filterStudentName")?.value || "",
        subjectId: document.getElementById("filterSubject")?.value || "",
        passed: passedValue 
    };
}

export function renderFilteredSubmissions(submissions, rol, filtersCount = 0, currentFilters, searchValue = "", searchType = "student") {
    const main = document.querySelector(".content");
    const showAcademicYear = (rol === "admin");

    main.innerHTML = `
        <div class="filtered-submissions-container">
            <div class="submissions-header">
                ${filtersCount > 0 ? `<button class="back-btn" data-back="submissions">← Back to all submissions</button>` : ""}
                <h2>Filtered Submissions</h2>
                <p class="submissions-subtitle">Filtered results from advanced search.</p>
            </div>
            <div class="submissions-actions">
                ${renderSearchTypeSelector(searchType)}
                <input type="text" id="searchInput" placeholder="Search..." value="${escapeHtmlContent(searchValue)}">
                <button class="filter-btn" id="openFiltersBtn">
                    <img src="src/img/filtrar.png" class="filter-icon-img" alt="Filter">
                    <span>Filters</span>
                    ${filtersCount > 0 ? `<span class="filter-badge">${filtersCount}</span>` : ""}
                </button>
            </div>
            <table class="submissions-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        ${rol === "teacher" || rol === "admin" ? "<th>STUDENT</th>" : ""}
                        <th>EXERCISE</th>
                        <th>SUBJECT</th>
                        ${showAcademicYear ? "<th>ACADEMIC YEAR</th>" : ""}
                        <th>LANGUAGE</th>
                        <th>SCORE</th>
                        <th>STATUS</th>
                        <th>DATE</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    ${submissions.map(sub => {
                        const scoreText = sub.evaluation?.score != null ? `${Math.round(sub.evaluation.score)}/100` : "-";
                        const buttonDisabled = sub.evaluation ? "" : "disabled";
                        const academicYear = sub.academic_year || "Unknown";
                        return `
                            <tr>
                                <td>#${sub.id}</td>
                                ${rol === "teacher" || rol === "admin" ? `<td>${sub.student_name || "Unknown"}</td>` : ""}
                                <td>${sub.exercise_title || "Unknown"}</td>
                                <td>${sub.subject_name || "-"}</td>
                                ${showAcademicYear ? `<td>${academicYear}</td>` : ""}
                                <td>${sub.language_name || "-"}</td>
                                <td>${scoreText}</td>
                                <td><span class="badge ${sub.status}">${sub.status}</span></td>
                                <td>${sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "N/A"}</td>
                                <td><button class="view-btn" data-submission-id="${sub.id}" ${buttonDisabled}>View Report</button></td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;
}
export function updateSubmissionsTableBody(submissions, rol) {
    const tbody = document.querySelector(".submissions-table tbody");
    if (!tbody) return;

    const showAcademicYear = (rol === "admin");

    tbody.innerHTML = submissions.map(sub => {
        const scoreText = sub.evaluation?.score != null ? `${Math.round(sub.evaluation.score)}/100` : "-";
        const buttonDisabled = sub.evaluation ? "" : "disabled";
        const academicYear = sub.academic_year || "Unknown";

        return `
            <tr>
                <td>#${sub.id}</td>
                ${rol === "teacher" || rol === "admin" ? `<td>${sub.student_name || "Unknown"}</td>` : ""}
                <td>${sub.exercise_title || "Unknown"}</td>
                <td>${sub.subject_name || "-"}</td>
                ${showAcademicYear ? `<td>${academicYear}</td>` : ""}
                <td>${sub.language_name || "-"}</td>
                <td>${scoreText}</td>
                <td><span class="badge ${sub.status}">${sub.status}</span></td>
                <td>${sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "N/A"}</td>
                <td><button class="view-btn" data-submission-id="${sub.id}" ${buttonDisabled}>View Report</button></td>
            </tr>
        `;
    }).join("");
}
/* HANDLE PDF DOWNLOAD VIEW */
export function renderPdfDownloadView(pdfBlob,submissionId)
{
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submission_${submissionId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

/*SUBMISSION LOADING VIEW */
export function renderSubmissionLoadingView(
    progress = 0,
    message = "",
    status = "pending"
)
{
    const main =
        document.querySelector(".content");

    const steps = [
    {
    title: "Submission queued",
    done:
        ["running_tests",
         "evaluating_rubric",
         "generating_pdf",
         "completed"].includes(status),

    active:
        status === "pending"
},
{
    title: "Running test cases",
    done:
        ["evaluating_rubric",
         "generating_pdf",
         "completed"].includes(status),

    active:
        status === "running_tests"
},
{
    title: "Evaluating rubric",
    done:
        ["generating_pdf",
         "completed"].includes(status),

    active:
        status === "evaluating_rubric"
},
{
    title: "Generating PDF",
    done:
        status === "completed",

    active:
        status === "generating_pdf"
},
{
    title: "Completed",
    done:
        status === "completed",

    active: false
}
];

    main.innerHTML = `
        <div class="submission-loading-page">

            <div class="loading-card">

                <!-- HEADER -->

                <div class="loading-header">

                    <h1>
                        Evaluating Your Submission
                    </h1>

                    <p>
                        ${message}
                    </p>

                </div>

                <!-- PROGRESS -->

                <div class="loading-progress-section">

                    <div class="progress-labels">

                        <span>
                            Overall Progress
                        </span>

                        <span>
                            ${progress}%
                        </span>

                    </div>

                    <div class="progress-bar">

                        <div
                            class="progress-fill"
                            style="width:${progress}%"
                        ></div>

                    </div>

                </div>

                <!-- STEPS -->

                <div class="loading-steps">

                    ${
                        steps.map(step => `
                            <div class="
                                loading-step
                                ${step.done ? "done" : ""}
                                ${step.active ? "active" : ""}
                            ">

                                <div class="step-icon">

                                    ${
                                        step.done
                                        ? "✓"
                                        : step.active
                                            ? "◌"
                                            : "○"
                                    }

                                </div>

                                <div class="step-title">
                                    ${step.title}
                                </div>

                                <div class="step-status">

                                    ${
                                        step.done
                                        ? "DONE"
                                        : step.active
                                            ? "PROCESSING"
                                            : ""
                                    }

                                </div>

                            </div>
                        `).join("")
                    }

                </div>

                <!-- FOOTER -->

                <div class="loading-tip">

                    💡 Tip:
                    Your submission is being thoroughly analyzed.
                    This typically takes 1-2 minutes for comprehensive feedback.

                </div>

            </div>

        </div>
    `;
}

/* COURSE MESSAGES */
export function renderCourseMessages(
    subjectId,
    contacts,  
    conversations,
    notifications,
    rol,
    subjectName = "" 
)
{
    // IMPORTANTE: subjectId aquí es realmente el offeringId
    const offeringId = subjectId;
    
    // OBTENER EL CONTENEDOR PRINCIPAL
    const main = document.querySelector(".content");
    
    // LIMPIAR TODO EL CONTENIDO PRINCIPAL
    main.innerHTML = "";
    
    // Si no tenemos subjectName, intentar obtenerlo del DOM anterior
    let displayName = subjectName;
    if (!displayName) {
        const oldTitle = document.querySelector(".course-title-page");
        if (oldTitle) {
            displayName = oldTitle.textContent;
        } else {
            displayName = "Course";
        }
    }
    
    // HEADER - TÍTULO DEL CURSO
    const header = document.createElement("div");
    header.classList.add("course-exercises-header");
    
    header.innerHTML = `
        <div class="header-top-row">
            <button class="back-btn" data-back="courses" data-subjectid="${offeringId}">
                <span class="back-icon">←</span>
                <span>Back to Subjects</span>
            </button>
        </div>
        <div class="course-info">
            <div class="course-icon2">
                <img src="src/img/courses.png" class="course-icon-img">
            </div>
            <div>
                <h1 class="course-title-page">${escapeHtmlContent(displayName)}</h1>
                <p class="course-subtitle-page">Course discussion and messages</p>
            </div>
        </div>
    `;
    main.appendChild(header);
    
    // TABS
    const tabs = document.createElement("div");
    tabs.classList.add("course-tabs");
    tabs.innerHTML = `
        <button class="course-tab exercises-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-book-open"></i>
            Exercises
        </button>

        <button class="course-tab active" data-offeringid="${offeringId}">
            <i class="fa-regular fa-message"></i>
            Messages
            ${notifications?.total_unread > 0 ? `<span class="message-badge">${notifications.total_unread}</span>` : ""}
        </button>
        
        <button class="course-tab students-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-users"></i>
            Students
        </button>
        
        <button class="course-tab professors-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-chalkboard-user"></i>
            Professors
        </button>
    `;
    main.appendChild(tabs);

    // CREAR CHAT
    const chatContainer = document.createElement("div");
    chatContainer.classList.add("course-messages-page");

    // Determinar el título de la lista según el rol
    const listTitle = rol === "student" ? "Professors" : "Students";
    const emptyMessage = rol === "student" ? "No professors found" : "No students found";

    chatContainer.innerHTML = `
        <div class="messages-layout">
            <!-- SIDEBAR -->
            <div class="messages-sidebar">
                <div class="sidebar-header">
                    <h3>${listTitle}</h3>
                </div>
                <div class="teachers-list">
                    ${contacts.length > 0
                        ? contacts.map(contact => {
                            const conv = conversations.find(
                                c => Number(c.user_id) === Number(contact.id)
                            );
                            return `
                                <div class="teacher-card open-chat-btn" data-userid="${contact.id}" data-username="${contact.name}">
                                    <div class="teacher-avatar">
                                        ${contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="teacher-info">
                                        <div class="teacher-name">${contact.name}</div>
                                        <div class="teacher-role">${rol === "student" ? "Professor" : "Student"}</div>
                                    </div>
                                    ${conv?.unread_count > 0 ? `<div class="teacher-unread">${conv.unread_count}</div>` : ""}
                                </div>
                            `;
                        }).join("")
                        : `<div class="empty-teachers">${emptyMessage}</div>`
                    }
                </div>
            </div>

            <!-- CHAT -->
            <div class="messages-chat">
                <div class="chat-placeholder">
                    <div class="chat-placeholder-icon">💬</div>
                    <h2>Course Discussion</h2>
                    <p>Select a ${rol === "student" ? "professor" : "student"} from the left panel to start chatting.</p>
                </div>
            </div>
        </div>
    `;

    main.appendChild(chatContainer);
}
/* CHAT VIEW - Genérico para profesor o estudiante */
export function renderChatView(
    userId,
    userName,
    messages,
    userPresence,
    currentUserId
)
{
    const chatContainer = document.querySelector(".messages-chat");
    if (!chatContainer) return;

    let messagesHTML = "";

    // Función para detectar si un mensaje es un archivo
    function isFileMessage(message) {
        if (!message) return false;
        const pattern = /^[📄📎🖼️📘📊📦📝]\s+.+\s+\([\d.]+\s+(KB|MB)\)$/;
        return pattern.test(message.trim());
    }

    function extractFileInfo(text) {
        const match = text.match(/^[📄📎🖼️📘📊📦📝]\s+(.+?)\s+\(([\d.]+\s+(KB|MB))\)$/);
        if (match) {
            return { filename: match[1], size: match[2] };
        }
        return null;
    }

    if (messages && messages.length > 0)
    {
        messagesHTML = messages.map(msg => {
            const isMine = Number(msg.sender_id) === Number(currentUserId);
            
            let displayMessage = "";
            let hasAttachments = false;
            let fileInfo = null;
            
            if (msg.attachments && msg.attachments.length > 0) {
                hasAttachments = true;
            } 
            else if (msg.message && isFileMessage(msg.message)) {
                hasAttachments = true;
                fileInfo = extractFileInfo(msg.message);
                displayMessage = "";
            } 
            else {
                displayMessage = msg.message || "";
            }

            return `
                <div class="chat-message-wrapper" data-message-id="${msg.id}" data-sender-id="${msg.sender_id}">
                    <div class="chat-message ${isMine ? "own-message" : "other-message"}">
                        ${!isMine ? `<div class="chat-avatar-small">${escapeHtmlContent(userName).charAt(0).toUpperCase()}</div>` : ""}
                        <div class="message-content">
                            <div class="message-meta">
                                ${isMine ? "Tú" : escapeHtmlContent(userName)}
                                <span class="message-time">${formatChatTime(msg.created_at)}</span>
                                ${isMine ? `
                                    <button class="message-delete-btn" data-message-id="${msg.id}" title="Eliminar mensaje">
                                        ✕
                                    </button>
                                ` : ""}
                            </div>
                            
                            ${displayMessage ? `<div class="message-bubble">${escapeHtmlContent(displayMessage).replace(/\n/g, '<br>')}</div>` : ""}
                            
                            ${hasAttachments ? `
                                <div class="attachments-container">
                                    ${(msg.attachments && msg.attachments.length > 0) ? 
                                        msg.attachments.map(att => `
                                            <button 
                                                class="attachment-btn download-attachment-btn"
                                                data-attachmentid="${att.id}"
                                                data-filename="${escapeHtmlContent(att.filename)}"
                                                type="button"
                                            >
                                                📄 ${escapeHtmlContent(att.filename)} (${att.file_size_formatted})
                                            </button>
                                        `).join("")
                                        :
                                        (fileInfo ? `
                                            <div class="attachment-unavailable">
                                                ⚠️ ${escapeHtmlContent(fileInfo.filename)} (${fileInfo.size}) - Archivo no disponible
                                            </div>
                                        ` : "")
                                    }
                                </div>
                            ` : ""}
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }
    else
    {
        messagesHTML = `<div class="empty-chat">No hay mensajes aún. ¡Envía el primero!</div>`;
    }

    chatContainer.innerHTML = `
        <div class="chat-wrapper">
            <div class="chat-header">
                <div class="chat-user">
                    <div class="teacher-avatar">${escapeHtmlContent(userName).charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="chat-user-name">${escapeHtmlContent(userName)}</div>
                        <div class="chat-status">
                            <span class="status-dot ${userPresence?.is_online ? "online" : "offline"}"></span>
                            ${userPresence?.is_online ? "En línea" : "Desconectado"}
                        </div>
                    </div>
                </div>
            </div>
            <div class="chat-messages">${messagesHTML}</div>
            <div class="chat-input-area">
                <label class="attach-btn" title="Adjuntar archivos">
                    📎
                    <input type="file" class="chat-file-input" data-userid="${userId}" multiple hidden>
                </label>
                <input type="text" class="chat-input" id="chatMessageInput" placeholder="Escribe tu mensaje...">
                <button class="send-chat-btn" data-userid="${userId}" data-username="${escapeHtmlContent(userName)}">Enviar</button>
            </div>
        </div>
    `;

    const messagesDiv = chatContainer.querySelector(".chat-messages");
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    const messageInput = document.getElementById("chatMessageInput");
    if (messageInput) messageInput.focus();
}

function formatChatTime(dateString) {
    if (!dateString) return "";
    
    // Parsear la fecha UTC
    const utcDate = new Date(dateString);
    
    if (isNaN(utcDate.getTime())) return "";
    
    // Sumar 2 horas (España UTC+2 en verano)
    const localDate = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000));
    
    const now = new Date();
    const diffMs = now.getTime() - localDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Ahora mismo";
    if (diffMins === 1) return "Hace 1 minuto";
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours === 1) return "Hace 1 hora";
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return localDate.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function escapeHtmlContent(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/* RENDER RANKING VIEW  */
export function renderRankingView(rankingData, myRanking, subjectName, rol = null)
{
    const main = document.querySelector(".content");
    
    const ranking = rankingData.ranking || [];
    const totalStudents = rankingData.total_students || ranking.length;
    const totalExercises = rankingData.total_exercises || 0;
    
    // Datos del estudiante actual
    let mySolved = 0;
    let myScore = 0;
    let myProgress = 0;
    let myRank = null;
    
    if (rol === "student") {
        if (myRanking) {
            myRank = myRanking.rank;
            mySolved = myRanking.solved_exercises || 0;
            myScore = myRanking.average_score || 0;
            myProgress = myRanking.progress_percentage || 0;
        } else {
            // Buscar en el ranking
            const currentUserId = localStorage.getItem("user_id");
            if (currentUserId) {
                const me = ranking.find(s => String(s.student_id) === String(currentUserId));
                if (me) {
                    myRank = me.rank;
                    mySolved = me.solved_exercises || 0;
                    myScore = me.average_score || 0;
                    myProgress = me.progress_percentage || 0;
                }
            }
        }
    }
    
    const remainingExercises = totalExercises - mySolved;
    
    main.innerHTML = `
        <div class="ranking-page">
            <!-- HEADER -->
            <div class="ranking-header">
                <button class="back-btn" data-back="course-exercises" data-subjectid="${rankingData.subject_id || subjectName}">
                    <span class="back-icon">←</span>
                    <span>Back to Course</span>
                </button>
                <h1>🏆 ${escapeHtmlContent(subjectName)}</h1>
                <p>Course Leaderboard • ${totalStudents} Students</p>
            </div>

            <!-- YOUR RANK CARD -->
            ${rol === "student" && myRank ? `
                <div class="your-rank-card">
                    <div class="your-rank-header">
                        <span class="your-rank-title">YOUR RANK</span>
                    </div>
                    <div class="your-rank-number">#${myRank}</div>
                    <div class="your-rank-subtitle">of ${totalStudents} students</div>
                    
                    <div class="your-rank-stats">
                        <div class="your-stat">
                            <span class="your-stat-label">EXERCISES SOLVED</span>
                            <span class="your-stat-value">${mySolved}/${totalExercises}</span>
                        </div>
                        <div class="your-stat">
                            <span class="your-stat-label">AVERAGE SCORE</span>
                            <span class="your-stat-value">${myScore}%</span>
                            <span class="your-stat-badge ${myScore >= 70 ? 'good' : 'needs-improvement'}">${myScore >= 70 ? 'Good' : 'Needs Improvement'}</span>
                        </div>
                    </div>
                    
                    <div class="your-rank-progress">
                        <div class="your-progress-label">
                            <span>PROGRESS</span>
                            <span>${myProgress}%</span>
                        </div>
                        <div class="your-progress-bar">
                            <div class="your-progress-fill" style="width: ${myProgress}%"></div>
                        </div>
                        <div class="your-progress-remaining">${remainingExercises} remaining</div>
                    </div>
                </div>
            ` : ""}

            <!-- TOP PERFORMERS (Top 3) -->
            <div class="top-performers">
                ${ranking.slice(0, 3).map((student, idx) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    return `
                        <div class="top-performer-card">
                            <div class="medal">${medals[idx]}</div>
                            <div class="performer-rank">${student.rank}º</div>
                            <div class="performer-avatar">${getInitials(student.name)}</div>
                            <div class="performer-name">${escapeHtmlContent(student.name)}</div>
                            <div class="performer-stats">
                                <div class="performer-solved">
                                    <span class="stat-label-small">Solved</span>
                                    <span class="stat-value-small">${student.solved_exercises || 0}/${totalExercises}</span>
                                </div>
                                <div class="performer-score">
                                    <span class="stat-label-small">Score</span>
                                    <span class="score-value">${student.average_score || 0}%</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>

            <!-- COMPLETE RANKING TABLE -->
            <div class="ranking-table-container">
                <div class="ranking-table-header">
                    <h2>Complete Ranking</h2>
                    <span>${totalStudents} Students</span>
                </div>
                
                <div class="table-responsive">
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Student</th>
                                <th>Solved</th>
                                <th>Progress</th>
                                <th>Avg Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ranking.map(student => {
                                const isMe = rol === "student" && myRank === student.rank;
                                return `
                                    <tr class="${isMe ? 'current-user-row' : ''}">
                                        <td class="rank-cell">
                                            ${student.rank}
                                            ${student.rank === 1 ? " 🏆" : student.rank === 2 ? " 🥈" : student.rank === 3 ? " 🥉" : ""}
                                            ${isMe ? ' 👤' : ''}
                                        </td>
                                        <td class="student-cell">
                                            <div class="student-avatar-small">${getInitials(student.name)}</div>
                                            <span class="student-name">${escapeHtmlContent(student.name)}</span>
                                            ${isMe ? '<span class="you-badge">You</span>' : ''}
                                        </td>
                                        <td class="solved-cell">${student.solved_exercises || 0}/${totalExercises}</td>
                                        <td class="progress-cell">
                                            <div class="progress-bar-small">
                                                <div class="progress-fill-small" style="width: ${student.progress_percentage || 0}%"></div>
                                            </div>
                                            <span class="progress-percent">${student.progress_percentage || 0}%</span>
                                        </td>
                                        <td class="score-cell ${(student.average_score || 0) >= 70 ? "score-high" : (student.average_score || 0) >= 50 ? "score-medium" : "score-low"}">
                                            ${student.average_score || 0}%
                                        </td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
// Función auxiliar para obtener iniciales
function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}


/* RENDER MY PROFILE VIEW - UNA SOLA COLUMNA */
export function renderMyProfile(user, stats) {
    const main = document.querySelector(".content");
    if (!main) return;
    console.log(stats);
    const memberSince = user.created_at 
        ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
        : "2024";
    
    const rol = stats.role || user.role || localStorage.getItem("rol");
    
    // Definir etiquetas según el rol
    let stat1Label = "";
    let stat2Label = "";
    let stat1Value = stats.stat1 || 0;
    let stat2Value = stats.stat2 || 0;
    
    if (rol === "student") {
        stat1Label = "Exercises Submitted";
        stat2Label = "Average Score";
        // classRank se muestra aparte
    } else if (rol === "teacher") {
        stat1Label = "Courses Teaching";
        stat2Label = "Students Taught";
    } else if (rol === "admin") {
        stat1Label = "Total Users";
        stat2Label = "Total Submissions";
    } else {
        stat1Label = "Stat 1";
        stat2Label = "Stat 2";
    }
    
    main.innerHTML = `
        <div class="profile-container">
            <button class="back-btn" data-back="dashboard">
                ← Back to Dashboard
            </button>
            <h1 class="profile-title">My Profile</h1>
            <p class="profile-subtitle">Manage your account information</p>
            <div class="profile-single-column">
                <div class="profile-avatar-section">
                    <div class="profile-avatar-large">
                        ${getInitialsProfile(user.name || "User")}
                    </div>
                    <h3 class="profile-name">${escapeHtmlContent(user.name || "User")}</h3>
                    <p class="profile-email">${escapeHtmlContent(user.email || "")}</p>
                    <div class="profile-role-badge ${rol}">${rol.toUpperCase()}</div>
                    <p class="profile-member-since">Member since ${memberSince}</p>
                </div>
                <div class="profile-info-card">
                    <div class="profile-card-header">
                        <h2>Personal Information</h2>
                        <button class="profile-edit-btn" id="editProfileBtn">✎ Edit Profile</button>
                    </div>
                    <div class="profile-view-mode" id="profileInfoView">
                        <div class="profile-info-row">
                            <div class="profile-info-label">Full Name</div>
                            <div class="profile-info-value">${escapeHtmlContent(user.name || "Not set")}</div>
                        </div>
                        <div class="profile-info-row">
                            <div class="profile-info-label">Email Address</div>
                            <div class="profile-info-value">
                                ${escapeHtmlContent(user.email || "Not set")}
                                <span class="profile-readonly">(Read-only)</span>
                            </div>
                        </div>
                        <div class="profile-info-row">
                            <div class="profile-info-label">Account Role</div>
                            <div class="profile-info-value">
                                <span class="role-tag-small ${rol}">${rol.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="profile-note">
                            <span>ℹ️</span>
                            <p>Email cannot be changed. Contact admin for assistance.<br>Role is assigned by administrators.</p>
                        </div>
                    </div>
                    <div class="profile-edit-mode hidden" id="profileEditView">
                        <div class="profile-info-row">
                            <div class="profile-info-label">Full Name</div>
                            <div class="profile-info-value">
                                <input type="text" id="editName" class="profile-input" 
                                       value="${escapeHtmlContent(user.name || "")}">
                            </div>
                        </div>
                        <div class="profile-info-row">
                            <div class="profile-info-label">Email Address</div>
                            <div class="profile-info-value">
                                <input type="email" id="editEmail" class="profile-input profile-input-disabled" 
                                       value="${escapeHtmlContent(user.email || "")}" disabled>
                                <span class="profile-readonly">(Cannot be changed)</span>
                            </div>
                        </div>
                        <div class="profile-info-row">
                            <div class="profile-info-label">Account Role</div>
                            <div class="profile-info-value">
                                <span class="role-tag-small ${rol}">${rol.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="profile-edit-actions">
                            <button class="profile-cancel-btn" id="cancelProfileEditBtn">Cancel</button>
                            <button class="profile-save-btn" id="saveProfileBtn">Save Changes</button>
                        </div>
                    </div>
                </div>
                <div class="profile-stats-card">
                    <h2>Account Statistics</h2>
                    <div class="profile-stats-row">
                        <div class="profile-stat-item">
                            <div class="profile-stat-number">${stat1Value}</div>
                            <div class="profile-stat-label">${stat1Label}</div>
                        </div>
                        <div class="profile-stat-item">
                            <div class="profile-stat-number">${stat2Value}${rol === "student" ? "%" : ""}</div>
                            <div class="profile-stat-label">${stat2Label}</div>
                        </div>
                        ${rol === "student" && stats.classRank ? `
                        <div class="profile-stat-item">
                            <div class="profile-stat-number">#${stats.classRank}</div>
                            <div class="profile-stat-label">Class Rank</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="profile-security-card">
                        <h2>Password & Security</h2>
                        <div class="security-info-row">
                            <div class="security-label">Your password was last changed</div>
                            <div class="security-value">${formatLastPasswordChange(user.last_password_change)}</div>
                        </div>
                        <button class="change-password-btn" id="changePasswordBtn">Change Password</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función auxiliar para iniciales
function getInitialsProfile(name) {
    if (!name) return "?";
    return name.split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatLastPasswordChange(dateString) {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function renderEditExercise(exercise, testCases, allLanguages, assignedLanguageIds, solution, subjectId = null, source = "exercises") {
    const main = document.querySelector(".content");
    
    let formattedDeadline = "";
    if (exercise.deadline) {
        const date = new Date(exercise.deadline);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            formattedDeadline = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }
    
    // Calcular estadísticas de test cases
    const totalTestCases = testCases.length;
    const visibleCount = testCases.filter(tc => tc.is_hidden !== true).length;
    const hiddenCount = totalTestCases - visibleCount;
    
    // Determinar el estado de visibilidad
    const isVisible = exercise.is_visible !== false && exercise.visibility !== false;
    const evaluationMode = exercise.evaluation_mode || "legacy_stdin";
    const returnType = exercise.return_type || "int";
    
    main.innerHTML = `
        <div class="edit-exercise-page" data-exercise-id="${exercise.id}" data-subject-id="${subjectId || ''}">
            <!-- Header -->
            <div class="edit-exercise-header">
                <button class="back-btn" 
                    data-back="${source || "exercises"}" 
                    data-subjectid="${subjectId || exercise.course_offering_id}"
                    data-courseid="${exercise.course_offering_id}">
                    <span class="back-icon">←</span>
                    <span>Back to ${source === "dashboard" ? "Dashboard" : source === "course-exercises" ? "Course" : "Exercises"}</span>
                </button>
                <div class="edit-header-title">
                    <h1>Edit Exercise</h1>
                    <p>Modify exercise details, settings, and test cases</p>
                </div>
            </div>

            <!-- Formulario principal -->
            <form id="editExerciseForm">
                <!-- Exercise Details Section -->
                <div class="edit-section">
                    <h2>Exercise Details</h2>
                    
                    <div class="form-group">
                        <label>Title <span class="required">*</span></label>
                        <input type="text" id="exerciseTitle" class="form-input-large" value="${escapeHtmlContent(exercise.title)}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Description <span class="required">*</span></label>
                        <textarea id="exerciseDescription" class="form-textarea-large" rows="5" required>${escapeHtmlContent(exercise.description || "")}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Deadline <span class="required">*</span></label>
                            <input type="datetime-local" id="exerciseDeadline" class="form-input-large" value="${formattedDeadline}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Evaluation Mode</label>
                            <select id="evaluationMode" class="form-input-large" disabled>
                                <option value="function_calls" selected>Function Calls (Recommended)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Return Type</label>
                            <select id="returnType" class="form-input-large">
                                <option value="int" ${returnType === "int" ? "selected" : ""}>Integer (int)</option>
                                <option value="str" ${returnType === "str" ? "selected" : ""}>String (str)</option>
                                <option value="bool" ${returnType === "bool" ? "selected" : ""}>Boolean (bool)</option>
                                <option value="float" ${returnType === "float" ? "selected" : ""}>Float (float)</option>
                                <option value="list_int" ${returnType === "list_int" ? "selected" : ""}>List of Integers (list[int])</option>
                                <option value="list_str" ${returnType === "list_str" ? "selected" : ""}>List of Strings (list[str])</option>
                                <option value="list_float" ${returnType === "list_float" ? "selected" : ""}>List of Floats (list[float])</option>
                                <option value="dict" ${returnType === "dict" ? "selected" : ""}>Dictionary (dict)</option>
                                <option value="void" ${returnType === "void" ? "selected" : ""}>Void (None)</option>
                                <option value="TreeNode" ${returnType === "TreeNode" ? "selected" : ""}>Binary Tree Node (TreeNode)</option>
                                <option value="ListNode" ${returnType === "ListNode" ? "selected" : ""}>Linked List Node (ListNode)</option>
                                <option value="GraphNode" ${returnType === "GraphNode" ? "selected" : ""}>Graph Node (GraphNode)</option>
                                <option value="NaryTreeNode" ${returnType === "NaryTreeNode" ? "selected" : ""}>N-ary Tree Node</option>
                                <option value="DoublyListNode" ${returnType === "DoublyListNode" ? "selected" : ""}>Doubly Linked List Node</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Status</label>
                            <div class="status-toggle">
                                <label class="visibility-checkbox">
                                    <input type="checkbox" id="exerciseVisible" ${isVisible ? "checked" : ""}>
                                    <span>Visible to students</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Function Arguments Section -->
                <div class="edit-section arguments-section" id="editArgumentsSection" style="${evaluationMode === "function_calls" ? "display: block;" : "display: none;"}">
                    <div class="section-header">
                        <h2>Function Arguments</h2>
                        <div class="arguments-stats">
                            <span class="stat-badge" id="editArgumentCount">0 arguments</span>
                        </div>
                        <button type="button" class="add-argument-btn" id="addEditArgumentBtn">+ Add Argument</button>
                    </div>
                    <p class="form-hint">Define the parameters that the student's function will receive. Order matters!</p>
                    
                    <div id="editArgumentsList" class="arguments-list">
                        <div class="empty-arguments">
                            <p>No arguments defined yet.</p>
                            <p class="hint">Click "Add Argument" to define function parameters.</p>
                        </div>
                    </div>
                </div>

                <!-- Solution Code Section -->
                <div class="edit-section">
                    <h2>Solution Code <span class="required">*</span></h2>
                    <div class="solution-editor-container">
                        <div class="solution-header">
                            <span class="solution-filename">solution.js</span>
                            <span class="solution-hint" id="editSolutionHint">Function signature: function solution(arg1, arg2, ...)</span>
                        </div>
                        <textarea id="solutionCode" class="solution-textarea-large" rows="10">${escapeHtmlContent(solution || "")}</textarea>
                    </div>
                </div>

                <!-- Programming Languages Section -->
                <div class="edit-section">
                    <h2>Programming Languages</h2>
                    <div class="languages-grid" id="languagesGrid">
                        ${allLanguages.map(lang => {
                            const isChecked = assignedLanguageIds.has(lang.id);
                            return `
                                <button type="button" 
                                    class="language-chip ${isChecked ? "active" : ""}" 
                                    data-lang-id="${lang.id}"
                                    data-lang-name="${escapeHtmlContent(lang.name)}"
                                    data-lang-version="${lang.version || ""}">
                                    <span class="lang-name">${escapeHtmlContent(lang.name)}</span>
                                    <span class="lang-version">${lang.version || ""}</span>
                                    ${isChecked ? '<span class="check-icon">✓</span>' : ''}
                                </button>
                            `;
                        }).join("")}
                    </div>
                </div>

                <!-- Test Cases Section con formato amigable -->
                <div class="edit-section testcases-section">
                    <div class="section-header">
                        <h2>Test Cases</h2>
                        <div class="testcases-stats">
                            <span class="stat-badge">${totalTestCases} total</span>
                            <span class="stat-badge visible">${visibleCount} visible</span>
                            <span class="stat-badge hidden">${hiddenCount} hidden</span>
                        </div>
                        <button type="button" class="add-test-btn" id="addTestCaseBtn">+ Add Test Case</button>
                    </div>
                    
                    <div class="info-card test-cases-info" style="margin-bottom: 20px;">
                        <div class="info-icon">💡</div>
                        <div class="info-content">
                            <h3>Test Cases Format</h3>
                            <p>Write inputs in a friendly format and they will be automatically converted to JSON:</p>
                            <ul style="margin: 5px 0 0 20px; font-size: 12px;">
                                <li><strong>Named arguments:</strong> <code>a = 5, b = 3</code> → <code>{"a":5,"b":3}</code></li>
                                <li><strong>Positional arguments:</strong> <code>5, 3</code> → <code>[5,3]</code></li>
                                <li><strong>Single value:</strong> <code>5</code> → <code>5</code></li>
                                <li><strong>String:</strong> <code>"hello"</code> → <code>"hello"</code></li>
                                <li><strong>Array:</strong> <code>[1, 2, 3]</code> → <code>[1,2,3]</code></li>
                                <li><strong>Object:</strong> <code>{name: "Juan", age: 25}</code> → <code>{"name":"Juan","age":25}</code></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div id="testCasesList" class="test-cases-list">
                        ${testCases.length === 0 ? `
                            <div class="empty-test-cases">
                                <p>No test cases defined yet.</p>
                                <p class="hint">Click "Add Test Case" to create test cases.</p>
                            </div>
                        ` : testCases.map((tc, index) => {
                            // Formatear input y output para mostrar en modo amigable
                            const inputValue = tc.input_data || "";
                            const outputValue = tc.expected_output || "";
                            const isVisible = tc.is_hidden !== true;
                            
                            // Intentar mostrar formato amigable
                            let friendlyInput = inputValue;
                            let friendlyOutput = outputValue;
                            
                            try {
                                if (inputValue) {
                                    const parsed = JSON.parse(inputValue);
                                    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                                        friendlyInput = Object.entries(parsed).map(([k, v]) => `${k} = ${v}`).join(', ');
                                    } else if (Array.isArray(parsed)) {
                                        friendlyInput = parsed.join(', ');
                                    } else {
                                        friendlyInput = String(parsed);
                                    }
                                }
                            } catch(e) {}
                            
                            try {
                                if (outputValue) {
                                    const parsed = JSON.parse(outputValue);
                                    friendlyOutput = JSON.stringify(parsed);
                                }
                            } catch(e) {}
                            
                            return `
                                <div class="test-case-item" data-test-id="${tc.id}">
                                    <div class="test-case-row">
                                        <div class="test-case-info">
                                            <span class="test-case-name">Case #${index + 1}</span>
                                            <label class="visibility-checkbox-small">
                                                <input type="checkbox" class="test-visibility" ${isVisible ? "checked" : ""}>
                                                <span>Visible</span>
                                            </label>
                                        </div>
                                        <button type="button" class="delete-test-btn" data-test-id="${tc.id}" title="Delete test case">✕</button>
                                    </div>
                                    <div class="test-case-data">
                                        <div class="test-input-group">
                                            <label>📥 Input (friendly format)</label>
                                            <textarea class="test-input-friendly" data-test-id="${tc.id}" rows="2" 
                                                      placeholder='Examples:
a = 5, b = 3
5, 3
a=5, b=3'>${escapeHtmlContent(friendlyInput)}</textarea>
                                            <div class="json-preview" style="margin-top: 8px;">
                                                <label style="font-size: 12px; color: #666;">🔧 JSON (auto-generated):</label>
                                                <textarea class="test-input-large" data-test-id="${tc.id}" rows="2" readonly style="background: #f5f5f5; font-family: monospace; font-size: 12px;">${escapeHtmlContent(inputValue)}</textarea>
                                            </div>
                                        </div>
                                        <div class="test-output-group">
                                            <label>📤 Expected Output (friendly format)</label>
                                            <textarea class="test-output-friendly" data-test-id="${tc.id}" rows="2" 
                                                      placeholder='Examples:
8
"hello"
[1, 2, 3]'>${escapeHtmlContent(friendlyOutput)}</textarea>
                                            <div class="json-preview" style="margin-top: 8px;">
                                                <label style="font-size: 12px; color: #666;">🔧 JSON (auto-generated):</label>
                                                <textarea class="test-output-large" data-test-id="${tc.id}" rows="2" readonly style="background: #f5f5f5; font-family: monospace; font-size: 12px;">${escapeHtmlContent(outputValue)}</textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>

                <!-- RUBRIC SECTION -->
                <div class="edit-section rubric-section">
                    <div class="section-header">
                        <h2>Evaluation Rubric</h2>
                        <button type="button" class="add-criterion-btn" id="addCriterionBtn">
                            + Add Criterion
                        </button>
                    </div>
                    <p class="form-hint">Define the evaluation criteria and descriptions for this exercise.</p>
    
                    <div id="rubricContainer" class="rubric-container"></div>
                </div>
                
                <!-- Action Buttons -->
                <div class="edit-actions" style="margin-top: 0; margin-bottom: 20px;">
                    <button type="button" class="cancel-btn" id="cancelEditBtn">Cancel</button>
                    <button type="submit" class="save-btn" id="saveExerciseBtn">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    // Inicializar event listeners para conversión automática después de cargar
    setTimeout(() => {
        initializeTestCaseConverters();
    }, 100);
}
// Función auxiliar para inicializar conversores de test cases
function initializeTestCaseConverters() {
    const testItems = document.querySelectorAll("#testCasesList .test-case-item");
    
    testItems.forEach(item => {
        const friendlyInput = item.querySelector('.test-input-friendly');
        const friendlyOutput = item.querySelector('.test-output-friendly');
        const jsonInput = item.querySelector('.test-input-large');
        const jsonOutput = item.querySelector('.test-output-large');
        
        if (friendlyInput && jsonInput) {
            const debouncedInput = debounce(() => {
                const jsonValue = convertToJSON(friendlyInput.value);
                if (jsonValue) {
                    jsonInput.value = formatJSONForDisplay(jsonValue);
                    // Marcar que hubo cambio para guardar
                    jsonInput.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    jsonInput.value = "";
                }
            }, 500);
            friendlyInput.addEventListener('input', debouncedInput);
        }
        
        if (friendlyOutput && jsonOutput) {
            const debouncedOutput = debounce(() => {
                const jsonValue = convertToJSON(friendlyOutput.value);
                if (jsonValue) {
                    jsonOutput.value = formatJSONForDisplay(jsonValue);
                    jsonOutput.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    jsonOutput.value = "";
                }
            }, 500);
            friendlyOutput.addEventListener('input', debouncedOutput);
        }
    });
}
// ==========================================
// EDIT EXERCISE - ARGUMENTS FUNCTIONS
// ==========================================
/* Cargar argumentos en el formulario de edición */
export async function renderEditExerciseArguments(argumentsData) {
    const argumentsList = document.getElementById("editArgumentsList");
    if (!argumentsList) return;
    
    if (!argumentsData || argumentsData.length === 0) {
        argumentsList.innerHTML = `
            <div class="empty-arguments">
                <p>No arguments defined yet.</p>
                <p class="hint">Click "Add Argument" to define function parameters.</p>
            </div>
        `;
        updateEditFormArgumentsCount();
        return;
    }
    
    // Ordenar por posición
    argumentsData.sort((a, b) => a.position - b.position);
    
    argumentsList.innerHTML = argumentsData.map((arg, idx) => `
        <div class="argument-item" data-argument-id="${arg.id}" data-original-name="${escapeHtmlContent(arg.name)}" data-position="${idx}">
            <div class="argument-header">
                <div class="argument-info">
                    <span class="argument-position">Argument #${idx + 1}</span>
                    <input type="text" class="argument-name-input" placeholder="Name (e.g., arr, target)" value="${escapeHtmlContent(arg.name)}">
                </div>
                <div class="argument-order-buttons">
                    <button type="button" class="move-argument-up-btn" data-argument-id="${arg.id}" title="Move up" ${idx === 0 ? 'disabled' : ''}>
                        ↑
                    </button>
                    <button type="button" class="move-argument-down-btn" data-argument-id="${arg.id}" title="Move down" ${idx === argumentsData.length - 1 ? 'disabled' : ''}>
                        ↓
                    </button>
                    <button type="button" class="delete-edit-argument-btn" data-argument-id="${arg.id}" title="Delete argument">
                        ✕
                    </button>
                </div>
            </div>
            <div class="argument-body">
                <div class="argument-type-group">
                    <label>Type</label>
                    <select class="argument-type-select">
                        <option value="int" ${arg.type === "int" ? "selected" : ""}>Integer (int)</option>
                        <option value="float" ${arg.type === "float" ? "selected" : ""}>Float (float)</option>
                        <option value="str" ${arg.type === "str" ? "selected" : ""}>String (str)</option>
                        <option value="bool" ${arg.type === "bool" ? "selected" : ""}>Boolean (bool)</option>
                        <option value="list_int" ${arg.type === "list_int" ? "selected" : ""}>List of Integers (list[int])</option>
                        <option value="list_str" ${arg.type === "list_str" ? "selected" : ""}>List of Strings (list[str])</option>
                        <option value="list_float" ${arg.type === "list_float" ? "selected" : ""}>List of Floats (list[float])</option>
                        <option value="dict" ${arg.type === "dict" ? "selected" : ""}>Dictionary (dict)</option>
                        <option value="TreeNode" ${arg.type === "TreeNode" ? "selected" : ""}>Binary Tree Node (TreeNode)</option>
                        <option value="ListNode" ${arg.type === "ListNode" ? "selected" : ""}>Linked List Node (ListNode)</option>
                        <option value="GraphNode" ${arg.type === "GraphNode" ? "selected" : ""}>Graph Node (GraphNode)</option>
                        <option value="NaryTreeNode" ${arg.type === "NaryTreeNode" ? "selected" : ""}>N-ary Tree Node</option>
                        <option value="DoublyListNode" ${arg.type === "DoublyListNode" ? "selected" : ""}>Doubly Linked List Node</option>
                    </select>
                </div>
                <div class="argument-desc-group">
                    <label>Description (optional)</label>
                    <input type="text" class="argument-desc-input" placeholder="e.g., The array to search in" value="${escapeHtmlContent(arg.description || "")}">
                </div>
                <div class="argument-default-group">
                    <label>Default Value (optional)</label>
                    <input type="text" class="argument-default-input" placeholder="e.g., null, 0, []" value="${escapeHtmlContent(arg.default_value || "")}">
                </div>
            </div>
        </div>
    `).join("");
    
    updateEditFormArgumentsCount();
}


/* Añadir argumento vacío al formulario de edición */
export function addEditArgumentToForm() {
    const argumentsList = document.getElementById("editArgumentsList");
    if (!argumentsList) return;
    
    const emptyDiv = argumentsList.querySelector(".empty-arguments");
    if (emptyDiv) emptyDiv.remove();
    
    const items = argumentsList.querySelectorAll(".argument-item:not([data-deleted='true'])");
    const newIndex = items.length + 1;
    const newId = `new_${Date.now()}`;
    
    const argumentHtml = `
        <div class="argument-item" data-argument-id="${newId}" data-position="${items.length}">
            <div class="argument-header">
                <div class="argument-info">
                    <span class="argument-position">Argument #${newIndex}</span>
                    <input type="text" class="argument-name-input" placeholder="Name (e.g., arr, target)" value="">
                </div>
                <div class="argument-order-buttons">
                    <button type="button" class="move-argument-up-btn" data-argument-id="${newId}" title="Move up" disabled>
                        ↑
                    </button>
                    <button type="button" class="move-argument-down-btn" data-argument-id="${newId}" title="Move down" disabled>
                        ↓
                    </button>
                    <button type="button" class="delete-edit-argument-btn" data-argument-id="${newId}" title="Delete argument">
                        ✕
                    </button>
                </div>
            </div>
            <div class="argument-body">
                <div class="argument-type-group">
                    <label>Type</label>
                    <select class="argument-type-select">
                        <option value="int">Integer (int)</option>
                        <option value="float">Float (float)</option>
                        <option value="str" selected>String (str)</option>
                        <option value="bool">Boolean (bool)</option>
                        <option value="list_int">List of Integers (list[int])</option>
                        <option value="list_str">List of Strings (list[str])</option>
                        <option value="list_float">List of Floats (list[float])</option>
                        <option value="dict">Dictionary (dict)</option>
                        <option value="TreeNode">Binary Tree Node (TreeNode)</option>
                        <option value="ListNode">Linked List Node (ListNode)</option>
                        <option value="GraphNode">Graph Node (GraphNode)</option>
                        <option value="NaryTreeNode">N-ary Tree Node</option>
                        <option value="DoublyListNode">Doubly Linked List Node</option>
                    </select>
                </div>
                <div class="argument-desc-group">
                    <label>Description (optional)</label>
                    <input type="text" class="argument-desc-input" placeholder="e.g., The array to search in">
                </div>
                <div class="argument-default-group">
                    <label>Default Value (optional)</label>
                    <input type="text" class="argument-default-input" placeholder="e.g., null, 0, []">
                </div>
            </div>
        </div>
    `;
    
    argumentsList.insertAdjacentHTML("beforeend", argumentHtml);
    renumberEditFormArguments();
    updateEditFormArgumentsCount();
    updateMoveButtonsState();
}

/* Eliminar argumento del formulario de edición */
export function deleteEditArgumentFromForm(argumentItem) {
    if (argumentItem) {
        const argumentId = argumentItem.dataset.argumentId;
        // Si tiene ID real (no es nuevo), marcarlo para eliminar en el backend
        if (argumentId && !argumentId.toString().startsWith("new_")) {
            argumentItem.dataset.deleted = "true";
            argumentItem.style.display = "none";
        } else {
            argumentItem.remove();
        }
        
        const argumentsList = document.getElementById("editArgumentsList");
        if (argumentsList && argumentsList.querySelectorAll(".argument-item:not([data-deleted='true'])").length === 0) {
            argumentsList.innerHTML = `
                <div class="empty-arguments">
                    <p>No arguments defined yet.</p>
                    <p class="hint">Click "Add Argument" to define function parameters.</p>
                </div>
            `;
        }
        
        renumberEditFormArguments();
        updateEditFormArgumentsCount();
    }
}

/* Renumerar argumentos en edición */
export function renumberEditFormArguments() {
    const items = document.querySelectorAll("#editArgumentsList .argument-item:not([data-deleted='true'])");
    items.forEach((item, idx) => {
        const positionSpan = item.querySelector(".argument-position");
        if (positionSpan) positionSpan.textContent = `Argument #${idx + 1}`;
        item.dataset.position = idx;
    });
}

/* Actualizar contador de argumentos en edición */
export function updateEditFormArgumentsCount() {
    const argumentsList = document.getElementById("editArgumentsList");
    if (!argumentsList) return;
    
    const count = argumentsList.querySelectorAll(".argument-item:not([data-deleted='true'])").length;
    const countSpan = document.getElementById("editArgumentCount");
    if (countSpan) countSpan.textContent = `${count} argument${count !== 1 ? 's' : ''}`;
}

/* Obtener argumentos del formulario de edición */
export function getEditFormArgumentsFromView() {
    const argumentsData = [];
    const items = document.querySelectorAll("#editArgumentsList .argument-item:not([data-deleted='true'])");
    
    items.forEach((item, idx) => {
        const nameInput = item.querySelector(".argument-name-input");
        const typeSelect = item.querySelector(".argument-type-select");
        const descInput = item.querySelector(".argument-desc-input");
        const defaultInput = item.querySelector(".argument-default-input");
        
        const name = nameInput?.value?.trim();
        
        if (name && name !== "") {
            const argumentId = item.dataset.argumentId;
            const isNew = argumentId && argumentId.toString().startsWith("new_");
            
            argumentsData.push({
                id: isNew ? null : parseInt(argumentId),
                name: name,
                type_name: typeSelect?.value || "str",
                position: idx,  
                description: descInput?.value || null,
                default_value: defaultInput?.value || null,
                is_new: isNew
            });
        }
    });
    
    // Añadir argumentos marcados para eliminar
    const deletedItems = document.querySelectorAll("#editArgumentsList .argument-item[data-deleted='true']");
    deletedItems.forEach(item => {
        const argumentId = item.dataset.argumentId;
        if (argumentId && !argumentId.toString().startsWith("new_")) {
            argumentsData.push({
                id: parseInt(argumentId),
                delete: true
            });
        }
    });
    
    return argumentsData;
}
/* Actualizar estado de los botones de movimiento */
export function updateMoveButtonsState() {
    const items = document.querySelectorAll("#editArgumentsList .argument-item:not([data-deleted='true'])");
    items.forEach((item, idx) => {
        const upBtn = item.querySelector(".move-argument-up-btn");
        const downBtn = item.querySelector(".move-argument-down-btn");
        
        if (upBtn) {
            upBtn.disabled = idx === 0;
        }
        if (downBtn) {
            downBtn.disabled = idx === items.length - 1;
        }
    });
}

/* Mover argumento hacia arriba */
export function moveArgumentUp(argumentItem) {
    const argumentsList = document.getElementById("editArgumentsList");
    if (!argumentsList) return;
    
    const items = Array.from(argumentsList.querySelectorAll(".argument-item:not([data-deleted='true'])"));
    const currentIndex = items.indexOf(argumentItem);
    
    if (currentIndex <= 0) return;
    
    // Intercambiar posiciones en el DOM
    const previousItem = items[currentIndex - 1];
    argumentsList.insertBefore(argumentItem, previousItem);
    
    // Renumerar y actualizar posiciones
    renumberEditFormArguments();
    updateMoveButtonsState();
}

/* Mover argumento hacia abajo */
export function moveArgumentDown(argumentItem) {
    const argumentsList = document.getElementById("editArgumentsList");
    if (!argumentsList) return;
    
    const items = Array.from(argumentsList.querySelectorAll(".argument-item:not([data-deleted='true'])"));
    const currentIndex = items.indexOf(argumentItem);
    
    if (currentIndex >= items.length - 1) return;
    
    // Intercambiar posiciones en el DOM
    const nextItem = items[currentIndex + 1];
    argumentsList.insertBefore(nextItem, argumentItem);
    
    // Renumerar y actualizar posiciones
    renumberEditFormArguments();
    updateMoveButtonsState();
}

// Función auxiliar para mostrar notificaciones (solo UI)
export function showNotification(message, type = "info") {
    const oldNotif = document.querySelector(".exercise-notification");
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement("div");
    notif.className = `exercise-notification ${type}`;
    notif.innerHTML = `
        <span>${type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 3000);
}

export function showSaveIndicator(card) {
    const existing = card.querySelector(".save-indicator");
    if (existing) existing.remove();
    
    const indicator = document.createElement("span");
    indicator.className = "save-indicator";
    indicator.innerHTML = "✓ Saved";
    indicator.style.cssText = "position: absolute; top: 8px; right: 40px; font-size: 11px; color: #10b981;";
    card.style.position = "relative";
    card.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 1500);
}

/* Añadir un test case vacío al DOM */
export function addTestCaseToUI() {
    const testCasesList = document.getElementById("testCasesList");
    if (!testCasesList) return;
    
    const newIndex = document.querySelectorAll(".test-case-item").length + 1;
    const newId = `new_${Date.now()}`;
    
    const newTestCaseHtml = `
        <div class="test-case-item" data-test-id="${newId}">
            <div class="test-case-row">
                <div class="test-case-info">
                    <span class="test-case-name">Case #${newIndex}</span>
                    <label class="visibility-checkbox-small">
                        <input type="checkbox" class="test-visibility" checked>
                        <span>Visible</span>
                    </label>
                </div>
                <button type="button" class="delete-test-btn" data-test-id="${newId}" title="Delete test case">
                    ✕
                </button>
            </div>
            <div class="test-case-data">
                <div class="test-input-group">
                    <label>Input</label>
                    <textarea class="test-input-large" rows="3" placeholder="Enter input data..."></textarea>
                </div>
                <div class="test-output-group">
                    <label>Expected Output</label>
                    <textarea class="test-output-large" rows="3" placeholder="Enter expected output..."></textarea>
                </div>
            </div>
        </div>
    `;
    
    testCasesList.insertAdjacentHTML("beforeend", newTestCaseHtml);
}

/* Eliminar un test case del DOM */
export function deleteTestCaseFromUI(testItem) {
    if (testItem) {
        testItem.remove();
        // Renumerar los nombres de los test cases
        const items = document.querySelectorAll(".test-case-item");
        items.forEach((item, idx) => {
            const nameSpan = item.querySelector(".test-case-name");
            if (nameSpan) nameSpan.textContent = `Case #${idx + 1}`;
        });
    }
}

/* Toggle lenguaje en el DOM (solo visual) */
export function toggleLanguageInUI(chip) {
    chip.classList.toggle("active");
    
    // Actualizar el check icon
    const checkIcon = chip.querySelector(".check-icon");
    if (checkIcon) {
        checkIcon.remove();
    } else if (chip.classList.contains("active")) {
        const newCheckIcon = document.createElement("span");
        newCheckIcon.className = "check-icon";
        newCheckIcon.innerHTML = "✓";
        chip.appendChild(newCheckIcon);
    }
}

/* ==========================================
   CREATE EXERCISE VIEW
   ========================================== */
// Tipos de datos soportados para argumentos
const ARGUMENT_TYPES = [
    { value: "int", label: "Integer (int)", example: "42" },
    { value: "float", label: "Float (float)", example: "3.14" },
    { value: "str", label: "String (str)", example: "hello" },
    { value: "bool", label: "Boolean (bool)", example: "true/false" },
    { value: "list_int", label: "List of Integers (list[int])", example: "[1, 2, 3]" },
    { value: "list_str", label: "List of Strings (list[str])", example: "['a', 'b', 'c']" },
    { value: "list_float", label: "List of Floats (list[float])", example: "[1.1, 2.2, 3.3]" },
    { value: "dict", label: "Dictionary (dict)", example: "{'key': 'value'}" }
];
function getDefaultDeadlineValue() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    
    // Obtener año
    const year = d.getFullYear();
    // Obtener mes (0-11) -> sumar 1 y padding a 2 dígitos
    const month = String(d.getMonth() + 1).padStart(2, '0');
    // Obtener día
    const day = String(d.getDate()).padStart(2, '0');
    // Obtener horas
    const hours = String(d.getHours()).padStart(2, '0');
    // Obtener minutos
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    // Formato correcto: YYYY-MM-DDThh:mm
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function renderCreateExercise(subjects, offerings, allLanguages, defaultSubjectId = null, defaultOfferingId = null, source = "exercises") {
    const main = document.querySelector(".content");
    
    const formattedDefaultDeadline = getDefaultDeadlineValue();
    
    main.innerHTML = `
        <div class="create-exercise-page">
            <div class="create-exercise-header">
                <button class="back-btn" 
                    data-back="${source}"
                    data-courseid="${source === "course-exercises" ? defaultOfferingId : ""}"
                    data-subjectid="${source === "course-exercises" ? defaultSubjectId : ""}">
                    <span class="back-icon">←</span>
                    <span>Back to ${source === "exercises" ? "Exercises" : source === "course-exercises" ? "Course" : "Dashboard"}</span>
                </button>
                <div class="create-header-title">
                    <h1>Create New Exercise</h1>
                    <p>Define exercise details, evaluation settings, and test cases</p>
                </div>
            </div>

            <form id="createExerciseForm" class="create-exercise-form">
                <!-- Exercise Information Section -->
                <div class="edit-section">
                    <h2>Exercise Information</h2>
                    
                    <div class="form-group">
                        <label>Exercise Title <span class="required">*</span></label>
                        <input type="text" id="exerciseTitle" class="form-input-large" 
                               placeholder="e.g., Binary Search Implementation" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Description <span class="required">*</span></label>
                        <textarea id="exerciseDescription" class="form-textarea-large" rows="6" 
                                  placeholder="Enter a detailed description..." required></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Course <span class="required">*</span></label>
                            <select id="exerciseCourse" class="form-input-large" required>
                                <option value="">Select a course...</option>
                                ${offerings.map(offering => `
                                    <option value="${offering.offering_id}" 
                                        ${defaultOfferingId && offering.offering_id === defaultOfferingId ? 'selected' : ''}>
                                        ${escapeHtmlContent(offering.subject_name)}
                                    </option>
                                `).join("")}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Deadline <span class="required">*</span></label>
                            <input type="datetime-local" id="exerciseDeadline" class="form-input-large" 
                                   value="${getDefaultDeadlineValue()}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Evaluation Mode <span class="required">*</span></label>
                            <select id="evaluationMode" class="form-input-large" disabled>
                                <option value="function_calls" selected>Function Calls (Recommended)</option>
                            </select>
                            <p class="form-hint">Function Calls mode allows you to define specific arguments for the student's function</p>
                        </div>

                        <div class="form-group">
                            <label>Return Type <span class="required">*</span></label>
                            <select id="returnType" class="form-input-large">
                                <option value="int">Integer (int)</option>
                                <option value="str">String (str)</option>
                                <option value="bool">Boolean (bool)</option>
                                <option value="float">Float (float)</option>
                                <option value="list_int">List of Integers (list[int])</option>
                                <option value="list_str">List of Strings (list[str])</option>
                                <option value="list_float">List of Floats (list[float])</option>
                                <option value="dict">Dictionary (dict)</option>
                                <option value="void">Void (None)</option>
                                <option value="TreeNode">Binary Tree Node (TreeNode)</option>
                                <option value="ListNode">Linked List Node (ListNode)</option>
                                <option value="GraphNode">Graph Node (GraphNode)</option>
                                <option value="NaryTreeNode">N-ary Tree Node</option>
                                <option value="DoublyListNode">Doubly Linked List Node</option>
                            </select>
                            <p class="form-hint">What type of value should the function return?</p>
                        </div>

                        <div class="form-group">
                            <label>Status</label>
                            <div class="status-toggle">
                                <label class="visibility-checkbox">
                                    <input type="checkbox" id="exerciseVisible" checked>
                                    <span>Make exercise visible to students</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Function Arguments Section -->
                <div class="edit-section arguments-section" id="argumentsSection">
                    <div class="section-header">
                        <h2>Function Arguments</h2>
                        <div class="arguments-stats">
                            <span class="stat-badge" id="argumentCount">0 arguments</span>
                        </div>
                        <button type="button" class="add-argument-btn" id="addArgumentBtn">+ Add Argument</button>
                    </div>
                    <p class="form-hint">Define the parameters that the student's function will receive. Order matters!</p>
                    
                    <div id="argumentsList" class="arguments-list">
                        <div class="empty-arguments">
                            <p>No arguments defined yet.</p>
                            <p class="hint">Click "Add Argument" to define function parameters.</p>
                        </div>
                    </div>
                </div>

                <!-- Programming Languages Section -->
                <div class="edit-section">
                    <h2>Programming Languages <span class="required">*</span></h2>
                    <p class="form-hint">Select at least one language that students can use</p>
                    <div class="languages-grid" id="languagesGrid">
                        ${allLanguages.map(lang => `
                            <button type="button" 
                                class="language-chip" 
                                data-lang-id="${lang.id}">
                                <span class="lang-name">${escapeHtmlContent(lang.name)}</span>
                                <span class="lang-version">${lang.version || ""}</span>
                            </button>
                        `).join("")}
                    </div>
                </div>

                <!-- Reference Solution Section -->
                <div class="edit-section">
                    <h2>Reference Solution <span class="required">*</span></h2>
                    <div class="solution-editor-container">
                        <div class="solution-header">
                            <span class="solution-filename">solution.js</span>
                            <span class="solution-hint" id="solutionHint">Function signature: function solution(arg1, arg2, ...)</span>
                        </div>
                        <textarea id="solutionCode" class="solution-textarea-large" rows="10" 
                                  placeholder="// Enter your reference solution code here

function solution(arr, target) {
    // Binary search implementation
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}"></textarea>
                    </div>
                </div>

                <!-- Test Cases Section con formato amigable -->
                <div class="edit-section testcases-section">
                    <div class="section-header">
                        <h2>Test Cases</h2>
                        <div class="testcases-stats">
                            <span class="stat-badge" id="testCaseCount">0 total</span>
                            <span class="stat-badge visible" id="visibleCount">0 visible</span>
                            <span class="stat-badge hidden" id="hiddenCount">0 hidden</span>
                        </div>
                        <button type="button" class="add-test-btn" id="addTestCaseBtn">+ Add Test Case</button>
                    </div>
                    
                    <div class="info-card test-cases-info" style="margin-bottom: 20px;">
                        <div class="info-icon">💡</div>
                        <div class="info-content">
                            <h3>Test Cases Format</h3>
                            <p>Write inputs in a friendly format and they will be automatically converted to JSON:</p>
                            <ul style="margin: 5px 0 0 20px; font-size: 12px;">
                                <li><strong>Named arguments:</strong> <code>a = 5, b = 3</code> → <code>{"a":5,"b":3}</code></li>
                                <li><strong>Positional arguments:</strong> <code>5, 3</code> → <code>[5,3]</code></li>
                                <li><strong>Single value:</strong> <code>5</code> → <code>5</code></li>
                                <li><strong>String:</strong> <code>"hello"</code> → <code>"hello"</code></li>
                                <li><strong>Array:</strong> <code>[1, 2, 3]</code> → <code>[1,2,3]</code></li>
                                <li><strong>Object:</strong> <code>{name: "Juan", age: 25}</code> → <code>{"name":"Juan","age":25}</code></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div id="testCasesList" class="test-cases-list">
                        <div class="empty-test-cases">
                            <p>No test cases defined yet.</p>
                            <p class="hint">Click "Add Test Case" to create test cases.</p>
                        </div>
                    </div>
                </div>

                <!-- RUBRIC SECTION -->
                <div class="edit-section rubric-section">
                    <div class="section-header">
                        <h2>Evaluation Rubric</h2>
                        <button type="button" class="add-criterion-btn" id="addCriterionBtn">
                            + Add Criterion
                        </button>
                    </div>
                    <p class="form-hint">Define the evaluation criteria and descriptions for this exercise.</p>
    
                    <div id="rubricContainer" class="rubric-container"></div>
                </div>

                <div class="info-card">
                    <div class="info-icon">ℹ️</div>
                    <div class="info-content">
                        <h3>Next Steps</h3>
                        <p>After creating the exercise, you can edit it to add more test cases or modify existing ones.</p>
                    </div>
                </div>

                <div class="edit-actions">
                    <button type="button" class="cancel-btn" id="cancelCreateBtn">Cancel</button>
                    <button type="submit" class="save-btn" id="createExerciseBtn">Create Exercise</button>
                </div>
            </form>
        </div>
    `;
    
    // Inicializar contadores
    updateCreateFormTestCaseStats();
    updateCreateFormArgumentsUI();
    
    // Inicializar rúbrica con ejemplos
    renderEmptyRubricSection('rubricContainer');
}

/* Función auxiliar para actualizar contador de criterios de rúbrica */
export function updateRubricCriteriaCount() {
    const criteriaList = document.getElementById("rubricCriteriaList");
    const countSpan = document.getElementById("rubricCriteriaCount");
    
    if (criteriaList && countSpan) {
        const count = criteriaList.querySelectorAll(".rubric-criterion-item:not(.empty-rubric)").length;
        countSpan.textContent = `${count} criterio${count !== 1 ? 's' : ''}`;
    }
}

/* Añadir test case al formulario de creación */
export function addTestCaseToCreateFormUI() {
    const testCasesList = document.getElementById("testCasesList");
    if (!testCasesList) return;
    
    const emptyDiv = testCasesList.querySelector(".empty-test-cases");
    if (emptyDiv) emptyDiv.remove();
    
    const newIndex = testCasesList.querySelectorAll(".test-case-item").length + 1;
    const newId = `new_${Date.now()}`;
    
    const newTestCaseHtml = `
        <div class="test-case-item" data-test-id="${newId}">
            <div class="test-case-row">
                <div class="test-case-info">
                    <span class="test-case-name">Case #${newIndex}</span>
                    <label class="visibility-checkbox-small">
                        <input type="checkbox" class="test-visibility" checked>
                        <span>Visible</span>
                    </label>
                </div>
                <button type="button" class="delete-test-btn" data-test-id="${newId}" title="Delete test case">✕</button>
            </div>
            <div class="test-case-data">
                <div class="test-input-group">
                    <label>📥 Input (friendly format)</label>
                    <textarea class="test-input-friendly" data-test-id="${newId}" rows="2" 
                              placeholder='Examples:
a = 5, b = 3
5, 3
a=5, b=3
[5, 3]
{"a": 5, "b": 3}'></textarea>
                    <div class="json-preview" style="margin-top: 8px;">
                        <label style="font-size: 12px; color: #666;">🔧 JSON (auto-generated):</label>
                        <textarea class="test-input-large" data-test-id="${newId}" rows="2" readonly style="background: #f5f5f5; font-family: monospace; font-size: 12px;"></textarea>
                    </div>
                </div>
                <div class="test-output-group">
                    <label>📤 Expected Output (friendly format)</label>
                    <textarea class="test-output-friendly" data-test-id="${newId}" rows="2" 
                              placeholder='Examples:
8
"hello"
[1, 2, 3]
{"result": 15}'></textarea>
                    <div class="json-preview" style="margin-top: 8px;">
                        <label style="font-size: 12px; color: #666;">🔧 JSON (auto-generated):</label>
                        <textarea class="test-output-large" data-test-id="${newId}" rows="2" readonly style="background: #f5f5f5; font-family: monospace; font-size: 12px;"></textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    testCasesList.insertAdjacentHTML("beforeend", newTestCaseHtml);
    
    // Agregar event listeners para conversión automática
    const newItem = testCasesList.querySelector(`.test-case-item[data-test-id="${newId}"]`);
    if (newItem) {
        const friendlyInput = newItem.querySelector('.test-input-friendly');
        const friendlyOutput = newItem.querySelector('.test-output-friendly');
        const jsonInput = newItem.querySelector('.test-input-large');
        const jsonOutput = newItem.querySelector('.test-output-large');
        
        // Conversión en tiempo real mientras escribe
        const debouncedInput = debounce(() => {
            if (friendlyInput && jsonInput) {
                const jsonValue = convertToJSON(friendlyInput.value);
                if (jsonValue) {
                    jsonInput.value = formatJSONForDisplay(jsonValue);
                } else {
                    jsonInput.value = "";
                }
            }
        }, 500);
        
        const debouncedOutput = debounce(() => {
            if (friendlyOutput && jsonOutput) {
                const jsonValue = convertToJSON(friendlyOutput.value);
                if (jsonValue) {
                    jsonOutput.value = formatJSONForDisplay(jsonValue);
                } else {
                    jsonOutput.value = "";
                }
            }
        }, 500);
        
        friendlyInput.addEventListener('input', debouncedInput);
        friendlyOutput.addEventListener('input', debouncedOutput);
    }
    
    renumberCreateFormTestCases();
    updateCreateFormTestCaseStats();
}

// Función debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


/* Eliminar test case del formulario de creación */
export function deleteTestCaseFromCreateFormUI(testItem) {
    if (testItem) {
        testItem.remove();
        
        const testCasesList = document.getElementById("testCasesList");
        if (testCasesList && testCasesList.querySelectorAll(".test-case-item").length === 0) {
            testCasesList.innerHTML = `
                <div class="empty-test-cases">
                    <p>No test cases defined yet.</p>
                    <p class="hint">Click "Add Test Case" to create test cases.</p>
                </div>
            `;
        }
        
        renumberCreateFormTestCases();
        updateCreateFormTestCaseStats();
    }
}

/* Renumerar test cases del formulario de creación */
function renumberCreateFormTestCases() {
    const items = document.querySelectorAll("#testCasesList .test-case-item");
    items.forEach((item, idx) => {
        const nameSpan = item.querySelector(".test-case-name");
        if (nameSpan) nameSpan.textContent = `Case #${idx + 1}`;
    });
}

/* Obtener test cases del formulario de creación */
export function getCreateFormTestCasesUI() {
    const testCases = [];
    const items = document.querySelectorAll("#testCasesList .test-case-item");
    
    items.forEach(item => {
        const friendlyInput = item.querySelector(".test-input-friendly");
        const friendlyOutput = item.querySelector(".test-output-friendly");
        const visibilityCheckbox = item.querySelector(".test-visibility");
        
        let inputData = null;
        let expectedOutput = null;
        
        // Convertir friendly input a JSON
        if (friendlyInput && friendlyInput.value.trim() !== "") {
            inputData = convertToJSON(friendlyInput.value);
        }
        // Si está vacío, usar "null" (representa entrada nula/vacía)
        if (!inputData) {
            inputData = "null";
        }
        
        // Convertir friendly output a JSON
        if (friendlyOutput && friendlyOutput.value.trim() !== "") {
            expectedOutput = convertToJSON(friendlyOutput.value);
        }
        
        // Validar que sean JSON válidos
        try { JSON.parse(inputData); } catch(e) { inputData = null; }
        try { JSON.parse(expectedOutput); } catch(e) { expectedOutput = null; }
        
        // Al menos expectedOutput debe existir
        if (expectedOutput !== null) {
            testCases.push({
                input_data: inputData !== null ? inputData : "null",
                expected_output: expectedOutput,
                is_visible: visibilityCheckbox ? visibilityCheckbox.checked : true
            });
        }
    });
    
    return testCases;
}
/* Obtener lenguajes seleccionados del formulario de creación */
export function getCreateFormSelectedLanguagesUI() {
    const selectedLanguages = [];
    const chips = document.querySelectorAll(".language-chip.active");
    
    chips.forEach(chip => {
        const langId = parseInt(chip.dataset.langId);
        if (langId) {
            selectedLanguages.push(langId);
        }
    });
    
    return selectedLanguages;
}

/* Alternar lenguaje en el formulario de creación */
export function toggleLanguageInCreateFormUI(chip) {
    chip.classList.toggle("active");
}
/* Actualizar estadísticas de test cases en el formulario de creación */
export function updateCreateFormTestCaseStats() {
    const testCasesList = document.getElementById("testCasesList");
    if (!testCasesList) return;
    
    const testItems = testCasesList.querySelectorAll(".test-case-item:not(.empty-test-cases)");
    const total = testItems.length;
    
    let visible = 0;
    let hidden = 0;
    
    testItems.forEach(item => {
        const checkbox = item.querySelector(".test-visibility");
        if (checkbox && checkbox.checked) {
            visible++;
        } else {
            hidden++;
        }
    });
    
    const totalSpan = document.getElementById("testCaseCount");
    const visibleSpan = document.getElementById("visibleCount");
    const hiddenSpan = document.getElementById("hiddenCount");
    
    if (totalSpan) totalSpan.textContent = `${total} total`;
    if (visibleSpan) visibleSpan.textContent = `${visible} visible`;
    if (hiddenSpan) hiddenSpan.textContent = `${hidden} hidden`;
}

/* Actualizar contador de argumentos en UI */
export function updateCreateFormArgumentsUI() {
    const argumentsList = document.getElementById("argumentsList");
    if (!argumentsList) return;
    
    const count = argumentsList.querySelectorAll(".argument-item").length;
    const countSpan = document.getElementById("argumentCount");
    if (countSpan) countSpan.textContent = `${count} argument${count !== 1 ? 's' : ''}`;
}
/* Obtener argumentos del formulario de creación */
export function getCreateFormArgumentsUI() {
    const argumentsData = [];
    const items = document.querySelectorAll("#argumentsList .argument-item");
    
    items.forEach((item, idx) => {
        const nameInput = item.querySelector(".argument-name-input");
        const typeSelect = item.querySelector(".argument-type-select");
        const descInput = item.querySelector(".argument-desc-input");
        const defaultInput = item.querySelector(".argument-default-input");
        
        const name = nameInput?.value?.trim();
        
        if (name && name !== "") {
            argumentsData.push({
                name: name,
                type: typeSelect?.value || "str",
                position: idx,
                description: descInput?.value || null,
                default_value: defaultInput?.value || null
            });
        }
    });
    
    return argumentsData;
}
/* Añadir argumento al formulario de creación */
export function addArgumentToCreateFormUI() {
    const argumentsList = document.getElementById("argumentsList");
    if (!argumentsList) return;
    
    const emptyDiv = argumentsList.querySelector(".empty-arguments");
    if (emptyDiv) emptyDiv.remove();
    
    const newIndex = argumentsList.querySelectorAll(".argument-item").length + 1;
    const newId = `arg_new_${Date.now()}`;
    
    const argumentHtml = `
        <div class="argument-item" data-argument-id="${newId}">
            <div class="argument-header">
                <div class="argument-info">
                    <span class="argument-position">Argument #${newIndex}</span>
                    <input type="text" class="argument-name-input" placeholder="Name (e.g., arr, target)" value="">
                </div>
                <button type="button" class="delete-argument-btn" data-argument-id="${newId}" title="Delete argument">
                    ✕
                </button>
            </div>
            <div class="argument-body">
                <div class="argument-type-group">
                    <label>Type</label>
                    <select class="argument-type-select">
                        <option value="int">Integer (int)</option>
                        <option value="float">Float (float)</option>
                        <option value="str" selected>String (str)</option>
                        <option value="bool">Boolean (bool)</option>
                        <option value="list_int">List of Integers (list[int])</option>
                        <option value="list_str">List of Strings (list[str])</option>
                        <option value="list_float">List of Floats (list[float])</option>
                        <option value="dict">Dictionary (dict)</option>
                        <option value="TreeNode">Binary Tree Node (TreeNode)</option>
                        <option value="ListNode">Linked List Node (ListNode)</option>
                        <option value="GraphNode">Graph Node (GraphNode)</option>
                        <option value="NaryTreeNode">N-ary Tree Node</option>
                        <option value="DoublyListNode">Doubly Linked List Node</option>
                    </select>
                </div>
                <div class="argument-desc-group">
                    <label>Description (optional)</label>
                    <input type="text" class="argument-desc-input" placeholder="e.g., The array to search in">
                </div>
                <div class="argument-default-group">
                    <label>Default Value (optional)</label>
                    <input type="text" class="argument-default-input" placeholder="e.g., null, 0, []">
                </div>
            </div>
        </div>
    `;
    
    argumentsList.insertAdjacentHTML("beforeend", argumentHtml);
    renumberCreateFormArguments();
    updateCreateFormArgumentsUI();
}

/* Renumerar argumentos */
function renumberCreateFormArguments() {
    const items = document.querySelectorAll("#argumentsList .argument-item");
    items.forEach((item, idx) => {
        const positionSpan = item.querySelector(".argument-position");
        if (positionSpan) positionSpan.textContent = `Argument #${idx + 1}`;
    });
}

/* Eliminar argumento del formulario de creación */
export function deleteArgumentFromCreateFormUI(argumentItem) {
    if (argumentItem) {
        argumentItem.remove();
        
        const argumentsList = document.getElementById("argumentsList");
        if (argumentsList && argumentsList.querySelectorAll(".argument-item").length === 0) {
            argumentsList.innerHTML = `
                <div class="empty-arguments">
                    <p>No arguments defined yet.</p>
                    <p class="hint">Click "Add Argument" to define function parameters.</p>
                </div>
            `;
        }
        
        renumberCreateFormArguments();
        updateCreateFormArgumentsUI();
    }
}


// RENDER DUPLICATE EXERCISE
export function renderDuplicateExerciseModal(exerciseId, exerciseTitle, courses) {
    // Eliminar modal existente si lo hay
    const existingModal = document.querySelector(".duplicate-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement("div");
    overlay.classList.add("duplicate-modal-overlay");
    
    overlay.innerHTML = `
        <div class="duplicate-modal">
            <div class="duplicate-modal-header">
                <h2>Duplicate Exercise</h2>
                <button class="close-duplicate-modal">×</button>
            </div>
            <div class="duplicate-modal-body">
                <div class="duplicate-info">
                    <span class="duplicate-label">SOURCE EXERCISE</span>
                    <span class="duplicate-exercise-name">${escapeHtmlContent(exerciseTitle)}</span>
                </div>
                
                <div class="duplicate-form-group">
                    <label for="targetCourse">Target Course <span class="required">*</span></label>
                    <select id="targetCourse" class="duplicate-select">
                        <option value="">Select a course...</option>
                        ${courses.map(course => `
                            <option value="${course.offering_id}" data-subject-id="${course.subject_id}">
                                ${escapeHtmlContent(course.subject_name)}
                            </option>
                        `).join("")}
                    </select>
                    <p class="duplicate-hint">The duplicated exercise will include all test cases, settings, and the solution code.</p>
                </div>
                
                <div class="duplicate-note">
                    <span>ℹ️</span>
                    <p>Note: The exercise will be created with the same title, description, deadline, visibility settings, test cases, and supported languages.</p>
                </div>
            </div>
            <div class="duplicate-modal-footer">
                <button class="cancel-duplicate-btn">Cancel</button>
                <button class="confirm-duplicate-btn" data-exercise-id="${exerciseId}">Duplicate Exercise</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Función para cerrar el modal
export function closeDuplicateModal() {
    const overlay = document.querySelector(".duplicate-modal-overlay");
    if (overlay) overlay.remove();
}


/* ==========================================
   RENDER RUBRIC SECTION
========================================== */
/* Pintar sección de rúbrica vacía en el formulario */
export function renderEmptyRubricSection(containerId, withExamples = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let criteriaHTML = "";
    
    if (withExamples) {
        // Ejemplos por defecto (solo para crear nuevo ejercicio)
        const defaultCriteria = [
            { name: "Corrección", description: "El programa produce la salida esperada para todos los casos de prueba." },
            { name: "Eficiencia", description: "El algoritmo es óptimo en tiempo y espacio." },
            { name: "Legibilidad", description: "El código es claro, bien indentado y fácil de seguir." },
            { name: "Buenas Prácticas", description: "Uso adecuado de nombres de variables, comentarios y estructura." },
            { name: "Documentación", description: "Incluye comentarios explicativos y documentación de funciones." }
        ];
        
        defaultCriteria.forEach((criterion, index) => {
            criteriaHTML += `
                <div class="rubric-criterion-item" data-criterion-index="${index}">
                    <div class="criterion-header">
                        <div class="criterion-name-wrapper">
                            <span class="criterion-bullet">•</span>
                            <input type="text" class="criterion-name-input" placeholder="Criterion name" value="${escapeHtmlContent(criterion.name)}">
                        </div>
                        <button type="button" class="remove-criterion-btn" data-index="${index}" title="Remove criterion">✕</button>
                    </div>
                    <div class="criterion-description-group">
                        <textarea class="criterion-description-input" rows="2" placeholder="Description of the criterion...">${escapeHtmlContent(criterion.description)}</textarea>
                    </div>
                </div>
            `;
        });
    } else {
        // Sin ejemplos (para edición cuando no tiene rúbrica)
        criteriaHTML = `
            <div class="empty-rubric">
                <p>No criteria defined yet.</p>
                <p class="hint">Click "Add Criterion" to add evaluation criteria.</p>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="rubric-editor">
            <div class="rubric-criteria-section">
                <div class="rubric-criteria-header">
                    <span class="criteria-title">Criteria</span>
                </div>
                
                <div id="rubricCriteriaList" class="rubric-criteria-list">
                    ${criteriaHTML}
                </div>
            </div>
        </div>
    `;
    
    updateRubricCriteriaCount();
}

/* Pintar rúbrica existente en el formulario */
export function renderRubricSection(containerId, rubricData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Convertir el objeto criteria a array si es necesario
    let criteria = [];
    if (rubricData?.criteria) {
        if (Array.isArray(rubricData.criteria)) {
            criteria = rubricData.criteria;
        } else {
            // Es un objeto { "nombre": "descripción", ... }
            criteria = Object.entries(rubricData.criteria).map(([name, description]) => ({
                name: name,
                description: description || ""
            }));
        }
    }
    
    let criteriaHTML = "";
    
    if (criteria.length === 0) {
        criteriaHTML = `
            <div class="empty-rubric">
                <p>No criteria defined yet.</p>
                <p class="hint">Click "Add Criterion" to add evaluation criteria.</p>
            </div>
        `;
    } else {
        criteriaHTML = criteria.map((criterion, index) => `
            <div class="rubric-criterion-item" data-criterion-index="${index}">
                <div class="criterion-header">
                    <div class="criterion-name-wrapper">
                        <span class="criterion-bullet">•</span>
                        <input type="text" class="criterion-name-input" placeholder="Criterion name" value="${escapeHtmlContent(criterion.name)}">
                    </div>
                    <button type="button" class="remove-criterion-btn" data-index="${index}" title="Remove criterion">✕</button>
                </div>
                <div class="criterion-description-group">
                    <textarea class="criterion-description-input" rows="2" placeholder="Description of the criterion...">${escapeHtmlContent(criterion.description || "")}</textarea>
                </div>
            </div>
        `).join("");
    }
    
    container.innerHTML = `
        <div class="rubric-editor">
            <div class="rubric-criteria-section">
                <div class="rubric-criteria-header">
                    <span class="criteria-title">Criteria</span>
                </div>
                
                <div id="rubricCriteriaList" class="rubric-criteria-list">
                    ${criteriaHTML}
                </div>
            </div>
        </div>
    `;
    
    updateRubricCriteriaCount();
}

/* Obtener datos de la rúbrica desde el DOM */
export function getRubricDataFromForm() {
    const criteriaList = document.getElementById("rubricCriteriaList");
    
    console.log("=== getRubricDataFromForm called ===");
    console.log("criteriaList exists?", !!criteriaList);
    
    if (!criteriaList) return { criteria: [], total_score: 100 };
    
    const criteria = [];
    // Buscar TODOS los elementos con clase rubric-criterion-item
    const items = criteriaList.querySelectorAll(".rubric-criterion-item");
    
    console.log("Found rubric-criterion-item count:", items.length);
    
    items.forEach((item, idx) => {
        // Buscar dentro del item
        const nameInput = item.querySelector(".criterion-name-input");
        const descInput = item.querySelector(".criterion-description-input");
        
        const name = nameInput ? nameInput.value?.trim() : "";
        const description = descInput ? descInput.value?.trim() : "";
        
        console.log(`Criterion ${idx}: name="${name}", description="${description.substring(0, 30)}..."`);
        
        if (name && name !== "") {
            criteria.push({ 
                name, 
                description
            });
        }
    });
    
    console.log("Final criteria array:", criteria);
    
    return { 
        criteria, 
        total_score: 100  
    };
}


/* Actualizar advertencia de pesos */
export function updateRubricWeightWarning() {
    const totalScoreInput = document.getElementById("rubricTotalScore");
    const criteriaList = document.getElementById("rubricCriteriaList");
    
    if (!totalScoreInput || !criteriaList) return;
    
    let totalWeight = 0;
    const items = criteriaList.querySelectorAll(".rubric-criterion-item");
    
    items.forEach(item => {
        const weightInput = item.querySelector(".criterion-weight-input");
        if (weightInput) {
            totalWeight += parseInt(weightInput.value) || 0;
        }
    });
    
    const totalScore = parseInt(totalScoreInput.value) || 100;
    
    let warningElement = document.querySelector(".rubric-weight-warning");
    
    if (totalWeight > totalScore) {
        if (!warningElement) {
            warningElement = document.createElement("div");
            warningElement.className = "rubric-weight-warning warning";
            totalScoreInput.parentNode.insertAdjacentElement("afterend", warningElement);
        }
        warningElement.innerHTML = `⚠️ Total weight (${totalWeight}) exceeds total score (${totalScore})`;
        warningElement.style.display = "block";
    } else if (warningElement) {
        warningElement.style.display = "none";
    }
}

/* Añadir criterio visualmente */
export function addCriterionToRubricUI() {
    const criteriaList = document.getElementById("rubricCriteriaList");
    if (!criteriaList) return;
    
    const emptyDiv = criteriaList.querySelector(".empty-rubric");
    if (emptyDiv) emptyDiv.remove();
    
    const newIndex = criteriaList.querySelectorAll(".rubric-criterion-item").length;
    
    const criterionHtml = `
        <div class="rubric-criterion-item" data-criterion-index="${newIndex}">
            <div class="criterion-header">
                <div class="criterion-name-wrapper">
                    <span class="criterion-bullet">•</span>
                    <input type="text" class="criterion-name-input" placeholder="Criterion name" value="">
                </div>
                <button type="button" class="remove-criterion-btn" data-index="${newIndex}" title="Remove criterion">✕</button>
            </div>
            <div class="criterion-description-group">
                <textarea class="criterion-description-input" rows="2" placeholder="Description of the criterion..."></textarea>
            </div>
        </div>
    `;
    
    criteriaList.insertAdjacentHTML("beforeend", criterionHtml);
    updateRubricCriteriaCount();
}

/* Eliminar criterio visualmente del DOM */
export function removeCriterionFromRubricUI(index) {
    const criteriaList = document.getElementById("rubricCriteriaList");
    if (!criteriaList) return;
    
    const item = criteriaList.querySelector(`.rubric-criterion-item[data-criterion-index="${index}"]`);
    if (item) {
        item.remove();
        
        // Renumerar índices
        const items = criteriaList.querySelectorAll(".rubric-criterion-item");
        items.forEach((item, idx) => {
            item.dataset.criterionIndex = idx;
            const removeBtn = item.querySelector(".remove-criterion-btn");
            if (removeBtn) removeBtn.dataset.index = idx;
        });
    }
    
    if (criteriaList.querySelectorAll(".rubric-criterion-item").length === 0) {
        criteriaList.innerHTML = `
            <div class="empty-rubric">
                <p>No criteria defined yet.</p>
                <p class="hint">Add criteria to evaluate student submissions.</p>
            </div>
        `;
    }
    
    updateRubricCriteriaCount();
    updateRubricWeightWarning();
}

/* Limpiar todos los criterios visualmente */
export function clearAllRubricCriteriaUI() {
    const criteriaList = document.getElementById("rubricCriteriaList");
    if (criteriaList) {
        criteriaList.innerHTML = `
            <div class="empty-rubric">
                <p>No criteria defined yet.</p>
                <p class="hint">Add criteria to evaluate student submissions.</p>
            </div>
        `;
        updateRubricCriteriaCount();
        updateRubricWeightWarning();
    }
}

// ==========================================
// RENDER NOTIFICATIONS DROPDOWN
// ==========================================
export function renderNotificationsDropdownView(notifications, unreadCount) {
    const list = document.getElementById("notificationsList");
    if (!list) return;
    
    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<div class="no-notifications">No new notifications</div>';
        return;
    }
    
    list.innerHTML = notifications.map(notif => {
        const timeAgo = formatChatTime(notif.created_at);
        const initial = notif.sender_name?.charAt(0).toUpperCase() || "?";
        const messagePreview = notif.message_preview || notif.message || "";
        
        return `
            <div class="notification-item" data-message-id="${notif.message_id}" data-sender-id="${notif.sender_id}" data-sender-name="${escapeHtmlContent(notif.sender_name)}">
                <div class="notification-avatar">${initial}</div>
                <div class="notification-content">
                    <div class="notification-title">
                        <span class="sender-name">${escapeHtmlContent(notif.sender_name)}</span>
                        <span> sent you a message</span>
                    </div>
                    <div class="notification-preview">${escapeHtmlContent(messagePreview.substring(0, 80))}${messagePreview.length > 80 ? '...' : ''}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <button class="notification-mark-read" data-message-id="${notif.message_id}" title="Mark as read">
                    ✓
                </button>
            </div>
        `;
    }).join("");
    
    // Actualizar contador en el header del dropdown
    const countSpan = document.getElementById("notificationsCount");
    if (countSpan) {
        countSpan.textContent = unreadCount;
    }
}


export function renderCourseStudents(students, subjectName, subjectId, offeringId, unreadCount = 0, rol, isTutor = false) {
    const main = document.querySelector(".content");
     function formatDateOnly(dateString) {
        if (!dateString) return "—";
        const date = new Date(dateString + "Z"); // Aseguramos UTC
        return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }
    // LIMPIAR TODO EL CONTENIDO PRINCIPAL
    main.innerHTML = "";

    // HEADER
    const header = document.createElement("div");
    header.classList.add("course-exercises-header");

    header.innerHTML = `
        <div class="header-top-row">
            <button class="back-btn" data-back="courses" data-subjectid="${subjectId}">
                <span class="back-icon">←</span>
                <span>Back to Subjects</span>
            </button>
        </div>

        <div class="course-info">
            <div class="course-icon2">
                <img src="src/img/courses.png" class="course-icon-img">
            </div>
            <div>
                <h1 class="course-title-page">${escapeHtmlContent(subjectName)}</h1>
                <p class="course-subtitle-page">Enrolled students in this course</p>
            </div>
        </div>
    `;
    main.appendChild(header);

    // TABS
    const tabs = document.createElement("div");
    tabs.classList.add("course-tabs");
    let messagesTabHTML = '';
    // Solo mostrar messages si NO es admin
    if (rol !== "admin") {
        messagesTabHTML = `
            <button class="course-tab messages-tab-btn" data-offeringid="${offeringId}">
                <i class="fa-regular fa-message"></i> Messages
                ${unreadCount > 0 ? `<span class="message-badge">${unreadCount}</span>` : ""}
            </button>
        `;
    }
    tabs.innerHTML = `
        <button class="course-tab exercises-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-book-open"></i> Exercises
        </button>
        ${messagesTabHTML}
        <button class="course-tab active" data-offeringid="${offeringId}">
            <i class="fa-regular fa-users"></i> Students
        </button>
        <button class="course-tab professors-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-chalkboard-user"></i> Professors
        </button>
    `;
    main.appendChild(tabs);

    const studentsContainer = document.createElement("div");
    studentsContainer.classList.add("course-students-container");

    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.enrollment_date).length;

    const statsHTML = `
        <div class="students-stats-bar">
            <div class="stat-item">
                <span class="stat-value">${totalStudents}</span>
                <span class="stat-label">Total Enrolled</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${activeStudents}</span>
                <span class="stat-label">Active</span>
            </div>
        </div>
    `;

    const showActions = (rol === "teacher" || rol === "admin") && isTutor;
    const showTutorMessage = rol === "teacher" && !isTutor;
    
    let tableHTML = `
        <div class="students-table-wrapper">
            <div class="students-actions-bar">
                <div class="search-students">
                    <input type="text" id="studentsSearchInput" placeholder="Search by name, email or ID..." class="search-input">
                </div>
                ${showActions ? `
                    <div class="students-actions-buttons">
                        <button class="export-csv-btn" id="exportStudentsCSVBtn" data-offering-id="${offeringId}">
                            📥 Export CSV
                        </button>
                        <button class="template-btn" id="downloadEnrollmentsTemplateBtn" data-offering-id="${offeringId}">
                            📄 Download Enrollment Template
                        </button>
                        <label class="upload-btn-label">
                            📤 Import Excel (Enroll)
                            <input type="file" id="uploadEnrollmentsExcel" accept=".xlsx" data-offering-id="${offeringId}" hidden>
                        </label>
                        ${rol === "admin" ? `
                            <label class="upload-btn-label" style="background: #e0e7ff;">
                                📤 Import + Create Users
                                <input type="file" id="uploadEnrollmentsWithUsersExcel" accept=".xlsx" data-offering-id="${offeringId}" hidden>
                            </label>
                        ` : ''}
                        <button class="enroll-student-btn" id="enrollStudentBtn" data-offering-id="${offeringId}" data-subject-id="${subjectId}">
                            + Enroll Student
                        </button>
                    </div>
                ` : (showTutorMessage ? `
                    <div class="tutor-info-message">
                        <span class="info-icon">ℹ️</span>
                        <span>Only tutors can enroll students. Contact an administrator to get tutor permissions.</span>
                    </div>
                ` : "")}
            </div>
            
            <table class="students-table">
                <thead>
                    <tr>
                        <th>STUDENT</th>
                        <th>STUDENT ID</th>
                        <th>EMAIL</th>
                        <th>ENROLLED</th>
                        <th>STATUS</th>
                        ${showActions ? '<th>ACTIONS</th>' : ''}
                    </tr>
                </thead>
                <tbody id="studentsTableBody">
                    ${students.length === 0 ? `
                        <tr>
                            <td colspan="${showActions ? 6 : 5}" style="text-align: center; padding: 40px;">
                                No students enrolled in this course yet.
                            </td>
                        </tr>
                    ` : students.map(student => {
                        const currentUserId = localStorage.getItem("user_id");
                        const isCurrentUser = currentUserId && Number(currentUserId) === Number(student.id);
                        
                        return `
                        <tr>
                            <td class="student-name-cell">
                                <div class="student-avatar-small">${getInitials(student.name)}</div>
                                <span class="student-name">${escapeHtmlContent(student.name)}</span>
                                ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}
                            </td>
                            <td class="student-id-cell">${student.id}</td>
                            <td class="student-email-cell">${escapeHtmlContent(student.email || "—")}</td>
                            <td class="enrolled-date-cell">${student.enrollment_date ? formatDateOnly(student.enrollment_date) : "—"}</td>
                            <td class="status-cell">
                                <span class="status-badge active">Active</span>
                            </td>
                            ${showActions ? `
                                <td class="actions-cell">
                                    ${!isCurrentUser ? `
                                        <button class="student-action-btn unenroll-student-btn" data-enrollment-id="${student.enrollment_id}" data-student-name="${escapeHtmlContent(student.name)}" title="Unenroll">
                                            🚫
                                        </button>
                                    ` : ''}
                                </td>
                            ` : ''}
                        </tr>
                    `}).join("")}
                </tbody>
            </table>
        </div>
    `;

    studentsContainer.innerHTML = statsHTML + tableHTML;
    main.appendChild(studentsContainer);
}

// ==========================================
// MODAL ENROLL STUDENT
// ==========================================

export function renderEnrollStudentModal(offeringId, subjectId, subjectName) {
    // Eliminar modal existente
    const existingModal = document.querySelector(".enroll-modal-overlay");
    if (existingModal) existingModal.remove();

    const overlay = document.createElement("div");
    overlay.classList.add("enroll-modal-overlay");

    overlay.innerHTML = `
        <div class="enroll-modal">
            <div class="enroll-modal-header">
                <h2>Enroll Student</h2>
                <button class="close-enroll-modal">×</button>
            </div>
            
            <div class="enroll-modal-body">
                <div class="enroll-search-section">
                    <input type="text" 
                           id="enrollStudentSearch" 
                           class="enroll-search-input" 
                           placeholder="Search students by name, email or ID..."
                           autocomplete="off">
                </div>
                
                <div id="enrollStudentsList" class="enroll-students-list">
                    <div class="enroll-loading">
                        <div class="spinner"></div>
                        <p>Loading students...</p>
                    </div>
                </div>
            </div>
            
            <div class="enroll-modal-footer">
                <button class="close-enroll-modal-btn">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Auto-focus en el input
    const searchInput = document.getElementById("enrollStudentSearch");
    if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
    }

    // 🔹 Cerrar solo con los botones (NO con clic en overlay)
    const closeModal = () => overlay.remove();
    overlay.querySelector(".close-enroll-modal").onclick = closeModal;
    overlay.querySelector(".close-enroll-modal-btn").onclick = closeModal;

}

// Renderizar lista de estudiantes en el modal 
export function renderEnrollStudentsList(students, offeringId) {
    const container = document.getElementById("enrollStudentsList");
    if (!container) return;
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="enroll-empty">
                <p>No students available to enroll</p>
                <p class="empty-hint">All students are already enrolled in this course</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = students.map(student => `
        <div class="enroll-student-item" data-student-id="${student.student_id || student.id}">
            <div class="student-info">
                <div class="student-name">${escapeHtmlContent(student.name)}</div>
                <div class="student-details">
                    ${escapeHtmlContent(student.email || 'No email')} · ${student.student_id || student.id}
                </div>
            </div>
            <button class="confirm-enroll-student-btn" 
                    data-student-id="${student.student_id || student.id}" 
                    data-student-name="${escapeHtmlContent(student.name)}"
                    data-offering-id="${offeringId}">
                Enroll
            </button>
        </div>
    `).join("");
}

// Mostrar loading
export function showEnrollModalLoading() {
    const container = document.getElementById("enrollStudentsList");
    if (container) {
        container.innerHTML = `
            <div class="enroll-loading">
                <div class="spinner"></div>
                <p>Searching students...</p>
            </div>
        `;
    }
}

// Cerrar modal
export function closeEnrollModal() {
    const overlay = document.querySelector(".enroll-modal-overlay");
    if (overlay) overlay.remove();
}

// ==========================================
// MODAL UNENROLL STUDENT - SOLO PINTAR
// ==========================================

export function renderUnenrollConfirmModal(studentName, subjectName, enrollmentId) {
    // Eliminar modal existente si lo hay
    const existingModal = document.querySelector(".unenroll-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement("div");
    overlay.classList.add("unenroll-modal-overlay");
    
    overlay.innerHTML = `
        <div class="unenroll-modal">
            <div class="unenroll-modal-header">
                <div class="unenroll-header-icon">⚠️</div>
                <h2>Unenroll Student</h2>
                <button class="close-unenroll-modal">×</button>
            </div>
            
            <div class="unenroll-modal-body">
                <p class="unenroll-warning">This action cannot be undone.</p>
                <p class="unenroll-confirm-text">
                    You are about to unenroll <strong>${escapeHtmlContent(studentName)}</strong> from 
                    <strong>${escapeHtmlContent(subjectName)}</strong>.
                </p>
                <p class="unenroll-info">
                    Their submission history will be preserved, but they will lose access to the course.
                </p>
            </div>
            
            <div class="unenroll-modal-footer">
                <button class="cancel-unenroll-btn">Cancel</button>
                <button class="confirm-unenroll-btn" data-enrollment-id="${enrollmentId}" data-student-name="${escapeHtmlContent(studentName)}">Yes, Unenroll</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

export function closeUnenrollModal() {
    const overlay = document.querySelector(".unenroll-modal-overlay");
    if (overlay) overlay.remove();
}


// ==========================================
// DUPLICATE COURSE OFFERING MODAL 
// ==========================================

export function renderDuplicateCourseOfferingModal(offerings, targetAcademicYears, currentAcademicYear) {
    // Eliminar modal existente
    const existingModal = document.querySelector(".duplicate-offering-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement("div");
    overlay.classList.add("duplicate-offering-modal-overlay");
    overlay.id = "duplicateOfferingModalOverlay";
    
    // Agrupar ofertas por año académico
    const offeringsByYear = {};
    offerings.forEach(offering => {
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
    
    // Ordenar años de más reciente a más antiguo
    const sortedYears = Object.keys(offeringsByYear).sort((a, b) => {
        if (a === "Unknown Year") return 1;
        if (b === "Unknown Year") return -1;
        const yearA = parseInt(a.split('-')[0]);
        const yearB = parseInt(b.split('-')[0]);
        return yearB - yearA;
    });
    
    // Años destino - SOLO AÑOS PASADOS (ya filtrados en controller)
    const targetYearsHTML = targetAcademicYears.map(year => {
        return `
            <option value="${year.id}" data-year-start="${year.start_year}" data-year-end="${year.end_year}">
                ${year.start_year}-${year.end_year}
            </option>
        `;
    }).join("");
    
    overlay.innerHTML = `
        <div class="duplicate-offering-modal">
            <div class="duplicate-offering-header">
                <h2>Duplicate Course Offering</h2>
                <button class="close-duplicate-offering-modal" id="closeDuplicateOfferingModalBtn">×</button>
            </div>
            
            <div class="duplicate-offering-steps">
                <div class="step-indicator">
                    <div class="step" data-step="1">
                        <span class="step-number">1</span>
                        <span class="step-label">Select Source</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step" data-step="2">
                        <span class="step-number">2</span>
                        <span class="step-label">Configure</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step" data-step="3">
                        <span class="step-number">3</span>
                        <span class="step-label">Review</span>
                    </div>
                </div>
            </div>
            
            <div class="duplicate-offering-body">
                <!-- Step 1 -->
                <div class="step-content step-1 active" id="step1Content">
                    <p class="step-description">Choose a course offering from a previous academic year to duplicate.</p>
                    
                    <div class="duplicate-year-selector">
                        <div class="year-tabs" id="yearTabs">
                            ${sortedYears.length > 0 ? `
                                <button class="duplicate-year-tab active" data-year="all">
                                    All years
                                </button>
                                ${sortedYears.map(year => `
                                    <button class="duplicate-year-tab" data-year="${year}">
                                        ${year}
                                    </button>
                                `).join("")}
                            ` : `
                                <div class="no-years-message">No offerings available</div>
                            `}
                        </div>
                    </div>
                    
                    <div class="offerings-list" id="offeringsList"></div>
                    
                    <div class="step-1-footer">
                        <button class="next-step-btn" id="step1NextBtn" disabled>Next</button>
                    </div>
                </div>
                
                <!-- Step 2 -->
                <div class="step-content step-2" id="step2Content">
                    <p class="step-description">Select the target academic year and customize the course name.</p>
                    
                    <div class="config-form">
                        <div class="form-group">
                            <label>Source Course Offering</label>
                            <div class="selected-offering-info" id="selectedOfferingInfo">
                                <div class="selected-offering-details">
                                    <span class="offering-name" id="selectedOfferingName">-</span>
                                    <span class="offering-year" id="selectedOfferingYear">-</span>
                                    <span class="offering-teacher" id="selectedOfferingTeacher">-</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Target Academic Year <span class="required">*</span></label>
                            <select id="targetAcademicYearSelect" class="config-select">
                                <option value="">Select academic year...</option>
                                ${targetYearsHTML}
                            </select>
                        </div>
                                               
                        <div class="info-box">
                            <span class="info-icon">ℹ️</span>
                            <div class="info-text">
                                <strong>What will be duplicated?</strong>
                                <ul>
                                    <li>All exercises from the original offering</li>
                                    <li>All test cases for each exercise</li>
                                    <li>All evaluation rubrics</li>
                                    <li>All programming languages allowed</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-2-footer">
                        <button class="back-step-btn" id="step2BackBtn">Back</button>
                        <button class="next-step-btn" id="step2NextBtn" disabled>Next</button>
                    </div>
                </div>
                
                <!-- Step 3 -->
                <div class="step-content step-3" id="step3Content">
                    <p class="step-description">Review the details before duplicating.</p>
                    
                    <div class="review-details" id="reviewDetails">
                        <div class="review-row">
                            <span class="review-label">Source Offering:</span>
                            <span class="review-value" id="reviewSource">-</span>
                        </div>
                        <div class="review-row">
                            <span class="review-label">Target Academic Year:</span>
                            <span class="review-value" id="reviewTargetYear">-</span>
                        </div>
                        <div class="review-divider"></div>
                        <div class="review-summary">
                            <div class="summary-item">
                                <span class="summary-number" id="reviewExercises">0</span>
                                <span>exercises to duplicate</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-number" id="reviewTestCases">0</span>
                                <span>test cases</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-number" id="reviewRubrics">0</span>
                                <span>rubric criteria</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-number" id="reviewLanguages">0</span>
                                <span>languages</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-3-footer">
                        <button class="back-step-btn" id="step3BackBtn">Back</button>
                        <button class="confirm-duplicate-offering-btn" id="confirmDuplicateOfferingBtn">Duplicate Offering</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Guardar datos como atributos en el modal
    overlay.dataset.offerings = JSON.stringify(offerings);
    overlay.dataset.offeringsByYear = JSON.stringify(offeringsByYear);
    overlay.dataset.sortedYears = JSON.stringify(sortedYears);
    
    // Mostrar todas las ofertas inicialmente (All years)
    const allOfferingsList = [];
    Object.values(offeringsByYear).forEach(offeringsList => {
        allOfferingsList.push(...offeringsList);
    });
    
    const offeringsListEl = overlay.querySelector("#offeringsList");
    if (offeringsListEl) {
        if (allOfferingsList.length > 0) {
            offeringsListEl.innerHTML = renderOfferingsList(allOfferingsList);
        } else {
            offeringsListEl.innerHTML = `
                <div class="empty-offerings-message">
                    <p>No course offerings available to duplicate</p>
                </div>
            `;
        }
    }
}

/* Función auxiliar para renderizar lista de ofertas */
function renderOfferingsList(offerings) {
    if (!offerings || offerings.length === 0) {
        return `
            <div class="empty-offerings-message">
                <p>No course offerings available</p>
            </div>
        `;
    }
    
    return offerings.map(offering => {
        // Obtener el año para mostrarlo
        const yearDisplay = offering.academic_year || 
                           (offering.academic_year_name) || 
                           (offering.start_year && offering.end_year ? `${offering.start_year}-${offering.end_year}` : '');
        
        // Si el profesor es "Unknown" o vacío, mostrar un guión o nada
        const teacherName = offering.teacher_name && offering.teacher_name !== "Unknown" && offering.teacher_name !== "Unknown Teacher" 
            ? offering.teacher_name 
            : "";
        
        return `
            <div class="duplicate-offering-card" data-offering-id="${offering.id}" data-offering-name="${escapeHtmlContent(offering.subject_name)}">
                <div class="offering-card-header">
                    <div class="offering-icon">
                        <img src="src/img/courses.png" class="offering-icon-img">
                    </div>
                    <div class="offering-info">
                        <h3 class="offering-title">${escapeHtmlContent(offering.subject_name)}</h3>
                        <p class="offering-meta">${escapeHtmlContent(yearDisplay)}</p>
                        ${teacherName ? `<p class="offering-teacher">${escapeHtmlContent(teacherName)}</p>` : ''}
                    </div>
                </div>
                <div class="offering-stats">
                    <div class="stat-item">
                        <span class="stat-number">${offering.exercises_count || 0}</span>
                        <span class="stat-label">exercises</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${offering.test_cases_count || 0}</span>
                        <span class="stat-label">test cases</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${offering.rubric_criteria_count || 0}</span>
                        <span class="stat-label">rubric criteria</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${offering.languages_count || 0}</span>
                        <span class="stat-label">languages</span>
                    </div>
                </div>
                <button class="select-offering-btn" data-offering-id="${offering.id}" data-offering-name="${escapeHtmlContent(offering.subject_name)}">
                    Select
                </button>
            </div>
        `;
    }).join("");
}
export function updateDuplicateOfferingModalUI(data) {
    const overlay = document.querySelector("#duplicateOfferingModalOverlay");
    if (!overlay) return;
    
    // Actualizar paso activo en los indicadores
    const steps = overlay.querySelectorAll('.step');
    steps.forEach((stepEl, idx) => {
        const stepNum = idx + 1;
        stepEl.classList.remove('active', 'completed');
        if (stepNum < data.currentStep) stepEl.classList.add('completed');
        if (stepNum === data.currentStep) stepEl.classList.add('active');
    });
    
    // Mostrar contenido del paso actual
    const contents = overlay.querySelectorAll('.step-content');
    contents.forEach((content, idx) => {
        if (idx + 1 === data.currentStep) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Actualizar botones según estado
    const step1NextBtn = overlay.querySelector('#step1NextBtn');
    if (step1NextBtn) step1NextBtn.disabled = !data.selectedOffering;
    
    const step2NextBtn = overlay.querySelector('#step2NextBtn');
    if (step2NextBtn) {
        const hasSelectedOffering = !!data.selectedOffering;
        const hasTargetYear = data.targetYearId && data.targetYearId !== "";
        step2NextBtn.disabled = !hasSelectedOffering || !hasTargetYear;
        
        if (step2NextBtn.disabled && !hasTargetYear && hasSelectedOffering) {
            step2NextBtn.title = "Please select a target academic year";
        } else if (step2NextBtn.disabled && !hasSelectedOffering) {
            step2NextBtn.title = "Please select a source course offering";
        } else {
            step2NextBtn.title = "";
        }
    }
    
    // Actualizar info de la oferta seleccionada con más detalles
    const selectedOfferingInfo = overlay.querySelector('#selectedOfferingInfo');
    if (selectedOfferingInfo && data.selectedOffering) {
        const yearDisplay = data.selectedOffering.academic_year || 
                           (data.selectedOffering.academic_year_name) || 
                           (data.selectedOffering.start_year && data.selectedOffering.end_year ? 
                            `${data.selectedOffering.start_year}-${data.selectedOffering.end_year}` : '');
        
        const teacherName = data.selectedOffering.teacher_name && 
                           data.selectedOffering.teacher_name !== "Unknown" && 
                           data.selectedOffering.teacher_name !== "Unknown Teacher"
                            ? data.selectedOffering.teacher_name 
                            : "";
        
        selectedOfferingInfo.innerHTML = `
            <div class="selected-offering-details">
                <span class="offering-name">${escapeHtmlContent(data.selectedOffering.subject_name)}</span>
                <span class="offering-year">${escapeHtmlContent(yearDisplay)}</span>
                ${teacherName ? `<span class="offering-teacher">${escapeHtmlContent(teacherName)}</span>` : ''}
            </div>
        `;
    }
    
    // Actualizar review
    const reviewSource = overlay.querySelector('#reviewSource');
    if (reviewSource && data.selectedOffering) {
        reviewSource.textContent = data.selectedOffering.subject_name;
    }
    
    const reviewExercises = overlay.querySelector('#reviewExercises');
    if (reviewExercises && data.selectedOffering) {
        reviewExercises.textContent = data.selectedOffering.exercises_count || 0;
    }
    
    const reviewTestCases = overlay.querySelector('#reviewTestCases');
    if (reviewTestCases && data.selectedOffering) {
        reviewTestCases.textContent = data.selectedOffering.test_cases_count || 0;
    }
    
    const reviewRubrics = overlay.querySelector('#reviewRubrics');
    if (reviewRubrics && data.selectedOffering) {
        reviewRubrics.textContent = data.selectedOffering.rubric_criteria_count || 0;
    }
    
    const reviewLanguages = overlay.querySelector('#reviewLanguages');
    if (reviewLanguages && data.selectedOffering) {
        reviewLanguages.textContent = data.selectedOffering.languages_count || 0;
    }
    
    const reviewTargetYear = overlay.querySelector('#reviewTargetYear');
    if (reviewTargetYear && data.targetYearName) {
        reviewTargetYear.textContent = data.targetYearName;
    } else if (reviewTargetYear) {
        reviewTargetYear.textContent = "Not selected";
    }
}

/* Actualizar lista de ofertas por año */
export function updateDuplicateOfferingOfferingsList(year, offeringsByYear) {
    const overlay = document.querySelector("#duplicateOfferingModalOverlay");
    if (!overlay) return;
    
    const offeringsList = overlay.querySelector("#offeringsList");
    if (!offeringsList) return;
    
    // Si year es "all", mostrar todas las ofertas de todos los años
    if (year === "all") {
        const allOfferings = [];
        Object.values(offeringsByYear).forEach(offerings => {
            allOfferings.push(...offerings);
        });
        if (allOfferings.length > 0) {
            offeringsList.innerHTML = renderOfferingsList(allOfferings);
        } else {
            offeringsList.innerHTML = `
                <div class="empty-offerings-message">
                    <p>No course offerings available to duplicate</p>
                </div>
            `;
        }
        return;
    }
    
    // Si no es "all", mostrar solo las ofertas del año específico
    if (offeringsByYear[year]) {
        offeringsList.innerHTML = renderOfferingsList(offeringsByYear[year]);
    } else {
        // Si no hay ofertas para ese año, mostrar mensaje
        offeringsList.innerHTML = `
            <div class="empty-offerings-message">
                <p>No course offerings available for ${year}</p>
            </div>
        `;
    }
}
/* Cerrar modal */
export function closeDuplicateOfferingModalView() {
    const overlay = document.querySelector("#duplicateOfferingModalOverlay");
    if (overlay) overlay.remove();
}

/* Mostrar loading en botón de confirmación */
export function setConfirmDuplicateButtonLoading(isLoading) {
    const overlay = document.querySelector("#duplicateOfferingModalOverlay");
    if (!overlay) return;
    
    const confirmBtn = overlay.querySelector("#confirmDuplicateOfferingBtn");
    if (confirmBtn) {
        if (isLoading) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '⏳ Duplicating...';
        } else {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Duplicate Offering';
        }
    }
}
// ==========================================
// RENDER COURSE PROFESSORS
// ==========================================
export function renderCourseProfessors(professors, availableProfessors, subjectName, subjectId, offeringId, unreadCount = 0, rol, isTutor = false) {
    const main = document.querySelector(".content");
    
    // LIMPIAR TODO EL CONTENIDO PRINCIPAL
    main.innerHTML = "";

    // HEADER
    const header = document.createElement("div");
    header.classList.add("course-exercises-header");

    header.innerHTML = `
        <div class="header-top-row">
            <button class="back-btn" data-back="courses" data-subjectid="${subjectId}">
                <span class="back-icon">←</span>
                <span>Back to Subjects</span>
            </button>
            ${(rol === "teacher" || rol === "admin") && isTutor ? `
                <button class="assign-professor-modal-btn" id="openAssignProfessorModalBtn" data-offering-id="${offeringId}">
                    Assign Professor
                </button>
            ` : ''}
        </div>
        <div class="course-info">
            <div class="course-icon2">
                <img src="src/img/courses.png" class="course-icon-img">
            </div>
            <div>
                <h1 class="course-title-page">${escapeHtmlContent(subjectName)}</h1>
                <p class="course-subtitle-page">${rol === "student" ? "Course professors" : "Manage professors assigned to this course"}</p>
            </div>
        </div>
    `;
    main.appendChild(header);

    // TABS
    const tabs = document.createElement("div");
    tabs.classList.add("course-tabs");
    let messagesTabHTML = '';
    if (rol !== "admin") {
        messagesTabHTML = `
            <button class="course-tab messages-tab-btn" data-offeringid="${offeringId}">
                <i class="fa-regular fa-message"></i> Messages
                ${unreadCount > 0 ? `<span class="message-badge">${unreadCount}</span>` : ""}
            </button>
        `;
    }
    tabs.innerHTML = `
        <button class="course-tab exercises-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-book-open"></i> Exercises
        </button>
        ${messagesTabHTML}
        <button class="course-tab students-tab-btn" data-offeringid="${offeringId}">
            <i class="fa-regular fa-users"></i> Students
        </button>
        <button class="course-tab active" data-offeringid="${offeringId}">
            <i class="fa-regular fa-chalkboard-user"></i> Professors
        </button>
    `;
    main.appendChild(tabs);

    // STATS CARDS
    const totalAssigned = professors.length;
    const tutors = professors.filter(p => p.is_tutor).length;
    const regularProfessors = totalAssigned - tutors;

    const statsContainer = document.createElement("div");
    statsContainer.className = "professors-stats-bar";
    statsContainer.innerHTML = `
        <div class="stat-card total">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
                <span class="stat-value">${totalAssigned}</span>
                <span class="stat-label">Total Assigned</span>
            </div>
        </div>
        <div class="stat-card tutors">
            <div class="stat-icon">👨‍🏫</div>
            <div class="stat-info">
                <span class="stat-value">${tutors}</span>
                <span class="stat-label">Tutors</span>
            </div>
        </div>
        <div class="stat-card professors">
            <div class="stat-icon">👩‍🏫</div>
            <div class="stat-info">
                <span class="stat-value">${regularProfessors}</span>
                <span class="stat-label">Professors</span>
            </div>
        </div>
    `;
    main.appendChild(statsContainer);

    // TABLE WRAPPER
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "professors-table-wrapper";

    // SOLO mostrar acciones si es TEACHER/ADMIN Y ES TUTOR
    const showActions = (rol === "teacher" || rol === "admin") && isTutor;

    // ACTIONS BAR - SOLO visible para tutor
    let actionsBarHTML = '';
    if (showActions) {
        actionsBarHTML = `
            <div class="professors-actions-bar">
                <div class="professors-search-bar">
                    <input type="text" id="professorsSearchInput" placeholder="Search by name, email or role..." class="search-input">
                </div>
                <div class="professors-buttons-group">
                    <button class="template-btn" id="downloadTemplateBtn">📄 Download Template</button>
                    <label class="upload-btn-label">
                        📤 Import Excel
                        <input type="file" id="uploadProfessorsExcel" accept=".xlsx" data-offering-id="${offeringId}" hidden>
                    </label>
                    <button class="bulk-json-btn" id="bulkJsonBtn" data-offering-id="${offeringId}">📋 Bulk JSON</button>
                </div>
            </div>
        `;
    } else {
        // Para estudiantes y profesores no tutores: solo barra de búsqueda
        actionsBarHTML = `
            <div class="professors-actions-bar">
                <div class="professors-search-bar">
                    <input type="text" id="professorsSearchInput" placeholder="Search by name, email or role..." class="search-input">
                </div>
            </div>
        `;
    }

    // TABLE HTML - CON BOTÓN DE ALTERNAR ROL (solo admin)
    const showRoleToggle = (rol === "admin"); // Solo administradores pueden cambiar el rol de tutor
    let tableRowsHTML = '';
    
    if (professors.length === 0) {
        tableRowsHTML = `
            <tr>
                <td colspan="${showActions ? 4 : 3}" style="text-align: center; padding: 60px 20px;">
                    <div class="empty-state">
                        <span class="empty-icon">👨‍🏫</span>
                        <p>No professors assigned to this course yet.</p>
                        ${showActions ? '<p class="empty-hint">Click "Assign Professor" to add one.</p>' : ''}
                    </div>
                </td>
            </tr>
        `;
    } else {
        tableRowsHTML = professors.map(prof => {
            const isCurrentUser = prof.is_current_user || false;
            const isTutorRole = prof.is_tutor === true;
            
            // Botón de alternar rol (solo admin y no es el usuario actual)
            let roleToggleButton = '';
            if (showRoleToggle && !isCurrentUser) {
                roleToggleButton = `
                    <button class="toggle-role-btn" 
                        data-assignment-id="${prof.assignment_id}" 
                        data-offering-id="${offeringId}"
                        data-professor-name="${escapeHtmlContent(prof.name)}"
                        data-is-tutor="${!isTutorRole}">
                        ${isTutorRole ? "Remove as Tutor" : "Make Tutor"}
                    </button>
                `;
            }
            
            return `
                <tr>
                    <td class="professor-name-cell">
                        <div class="professor-avatar-small">${getInitials(prof.name)}</div>
                        <span class="professor-name">${escapeHtmlContent(prof.name)}</span>
                        ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}
                    </td>
                    <td class="professor-email-cell">${escapeHtmlContent(prof.email)}</td>
                    <td class="role-cell">
                        <span class="role-badge ${isTutorRole ? 'tutor' : 'professor'}">
                            ${isTutorRole ? 'Tutor' : 'Professor'}
                        </span>
                        ${roleToggleButton}
                    </td>
                    ${showActions && !isCurrentUser ? `
                        <td class="actions-cell">
                            <button class="remove-professor-btn" 
                                data-assignment-id="${prof.assignment_id}" 
                                data-professor-name="${escapeHtmlContent(prof.name)}" 
                                data-offering-id="${offeringId}" 
                                title="Remove">
                                Remove
                            </button>
                        </td>
                    ` : (showActions && isCurrentUser ? `
                        <td class="actions-cell">
                            <span class="current-user-note">(You)</span>
                        </td>
                    ` : '')}
                </tr>
            `;
        }).join("");
    }

    tableWrapper.innerHTML = `
        ${actionsBarHTML}
        <div style="overflow-x: auto;">
            <table class="professors-table">
                <thead>
                    <tr>
                        <th>PROFESSOR</th>
                        <th>EMAIL</th>
                        <th>ROLE</th>
                        ${showActions ? '<th>ACTIONS</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHTML}
                </tbody>
            </table>
        </div>
    `;

    main.appendChild(tableWrapper);
}
// ==========================================
// FUNCIONES AUXILIARES UI 
// ==========================================

/* Buscar en la tabla de profesores (filtro en tiempo real) */
export function searchProfessorsTableView(searchTerm) {
    let tableBody = document.querySelector("#professorsTableBody");
    
    if (!tableBody) {
        tableBody = document.querySelector(".professors-table tbody");
    }
    
    if (!tableBody) {
        console.log("No se encontró la tabla de profesores");
        return;
    }
    
    const rows = tableBody.querySelectorAll("tr");
    const searchLower = searchTerm.trim().toLowerCase();
    
    rows.forEach(row => {
        if (row.querySelector('td[colspan]')) return;
        
        const nameCell = row.querySelector(".professor-name");
        const emailCell = row.querySelector(".professor-email-cell");
        const roleCell = row.querySelector(".role-badge");
        
        const name = nameCell?.textContent.toLowerCase() || "";
        const email = emailCell?.textContent.toLowerCase() || "";
        const role = roleCell?.textContent.toLowerCase() || "";
        
        let matches = false;
        
        if (searchTerm.trim() === "") {
            matches = true;
        } else {
            // 1. Buscar en el nombre completo (para casos como "Jesika J")
            const fullNameMatches = name.startsWith(searchLower);
            
            // 2. Dividir el nombre en palabras y buscar en cada palabra
            const nameWords = name.split(/\s+/);
            const anyWordMatches = nameWords.some(word => word.startsWith(searchLower));
            
            // 3. Buscar en email y rol
            const emailMatches = email.startsWith(searchLower);
            const roleMatches = role.startsWith(searchLower);
            
            matches = fullNameMatches || anyWordMatches || emailMatches || roleMatches;
        }
        
        row.style.display = matches ? "" : "none";
    });
}


/* Función para abrir modal de Bulk JSON */
export function renderBulkJsonModal(offeringId, onConfirmCallback) {
    const existingModal = document.querySelector(".bulk-json-modal-overlay");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.className = "bulk-json-modal-overlay";
    modal.innerHTML = `
        <div class="bulk-json-modal">
            <div class="bulk-json-header">
                <h3>Bulk Assign Professors (JSON)</h3>
                <button class="close-bulk-json">×</button>
            </div>
            <div class="bulk-json-body">
                <p class="bulk-json-hint">Enter a JSON array of assignments:</p>
                <textarea id="bulkJsonInput" class="bulk-json-input" rows="10" placeholder='[
  {"professor_email": "professor1@example.com"},
  {"professor_email": "professor2@example.com"},
  {"professor_email": "professor3@example.com"}
]'></textarea>
                <div class="bulk-json-example">
                    <strong>📋 Example format:</strong>
                    <pre>[
  {"professor_email": "john.doe@university.com"},
  {"professor_email": "jane.smith@university.com"}
]</pre>
                    <p class="bulk-json-note">💡 Note: Only the professor_email field is required. The course offering ID will be automatically set.</p>
                </div>
            </div>
            <div class="bulk-json-footer">
                <button class="cancel-bulk-json">Cancel</button>
                <button class="confirm-bulk-json" data-offering-id="${offeringId}">Create Assignments</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    // Botones de cierre
    modal.querySelector(".close-bulk-json").onclick = closeModal;
    modal.querySelector(".cancel-bulk-json").onclick = closeModal;

    // **IMPORTANTE: ELIMINAR esta línea si existe**
    // modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    // Confirmación
    if (onConfirmCallback) {
        modal.querySelector(".confirm-bulk-json").onclick = async () => {
            const jsonInput = document.getElementById("bulkJsonInput").value;
            const offeringIdModal = modal.querySelector(".confirm-bulk-json").dataset.offeringId;
            onConfirmCallback(jsonInput, offeringIdModal, closeModal);
        };
    }

    return modal;
}

/* Descargar plantilla de asignaciones */
export function downloadProfessorsTemplateUI(blob) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_asignacion_profesores.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

// ==========================================
// MODAL ASIGNAR PROFESOR (CON BÚSQUEDA)
// ==========================================

export function renderAssignProfessorModal(offeringId, availableProfessors) {
    // Eliminar modal existente si lo hay
    const existingModal = document.querySelector(".assign-professor-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement("div");
    modal.className = "assign-professor-modal-overlay";
    modal.id = "assignProfessorModalOverlay";
    
    modal.innerHTML = `
        <div class="assign-professor-modal">
            <div class="assign-professor-header">
                <h3>Assign Professor</h3>
                <button class="close-assign-modal">×</button>
            </div>
            
            <div class="assign-professor-body">
                <div class="assign-search-section">
                    <input type="text" id="assignProfessorSearch" placeholder="Search by name or email..." class="assign-search-input">
                </div>
                
                <div id="availableProfessorsList" class="available-professors-list">
                    <div class="loading-profs">
                        <div class="spinner"></div>
                        <p>Loading professors...</p>
                    </div>
                </div>
            </div>
            
            <div class="assign-professor-footer">
                <button class="cancel-assign-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Renderizar lista inicial
    if (availableProfessors && availableProfessors.length > 0) {
        renderAvailableProfessorsList(availableProfessors, offeringId);
    } else {
        const listContainer = modal.querySelector("#availableProfessorsList");
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="empty-profs">
                    <p>No professors available to assign</p>
                    <p class="empty-hint">All professors are already assigned to this course</p>
                </div>
            `;
        }
    }
    
    // Configurar búsqueda en tiempo real
    const searchInput = modal.querySelector("#assignProfessorSearch");
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value;
                filterAvailableProfessorsList(searchTerm, offeringId);
            }, 300);
        });
    }
    
    // Configurar eventos de cierre SOLO con botones
    const closeModal = () => modal.remove();
    modal.querySelector(".close-assign-modal").onclick = closeModal;
    modal.querySelector(".cancel-assign-btn").onclick = closeModal;
    
    // **ELIMINAR la línea que cierra al hacer clic en el overlay**
    // modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    
    return modal;
}
export function renderAvailableProfessorsList(professors, offeringId) {
    const listContainer = document.querySelector("#availableProfessorsList");
    if (!listContainer) return;
    
    if (!professors || professors.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-profs">
                <p>No professors available to assign</p>
                <p class="empty-hint">All professors are already assigned to this course</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = professors.map(prof => `
        <div class="available-professor-item" data-professor-email="${escapeHtmlContent(prof.email)}" data-professor-id="${prof.id}">
            <div class="professor-avatar">${getInitials(prof.name)}</div>
            <div class="professor-details">
                <div class="professor-full-name">${escapeHtmlContent(prof.name)}</div>
                <div class="professor-email-detail">${escapeHtmlContent(prof.email)}</div>
            </div>
            <button class="assign-professor-btn" 
                    data-professor-email="${escapeHtmlContent(prof.email)}"
                    data-professor-name="${escapeHtmlContent(prof.name)}"
                    data-offering-id="${offeringId}">
                Assign
            </button>
        </div>
    `).join("");
}

// Función para filtrar la lista (simulada, en producción se haría fetch)
let currentAvailableProfessors = [];
export function setAvailableProfessorsData(professors) {
    currentAvailableProfessors = professors;
}

export function filterAvailableProfessorsList(searchTerm, offeringId) {
    const listContainer = document.querySelector("#availableProfessorsList");
    if (!listContainer) return;
    
    const searchLower = searchTerm.trim().toLowerCase();
    
    let filtered = currentAvailableProfessors;
    
    if (searchTerm.trim() !== "") {
        filtered = currentAvailableProfessors.filter(prof => {
            const name = prof.name.toLowerCase();
            const email = prof.email.toLowerCase();
            
            // 1. Buscar en el nombre completo
            const fullNameMatches = name.startsWith(searchLower);
            
            // 2. Dividir el nombre en palabras y buscar en cada palabra
            const nameWords = name.split(/\s+/);
            const anyWordMatches = nameWords.some(word => word.startsWith(searchLower));
            
            // 3. Buscar en email
            const emailMatches = email.startsWith(searchLower);
            
            return fullNameMatches || anyWordMatches || emailMatches;
        });
    }
    
    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-profs">
                <p>No professors match "${escapeHtmlContent(searchTerm)}"</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = filtered.map(prof => `
        <div class="available-professor-item" data-professor-email="${escapeHtmlContent(prof.email)}" data-professor-id="${prof.id}">
            <div class="professor-avatar">${getInitials(prof.name)}</div>
            <div class="professor-details">
                <div class="professor-full-name">${escapeHtmlContent(prof.name)}</div>
                <div class="professor-email-detail">${escapeHtmlContent(prof.email)}</div>
            </div>
            <button class="assign-professor-btn" 
                    data-professor-email="${escapeHtmlContent(prof.email)}"
                    data-professor-name="${escapeHtmlContent(prof.name)}"
                    data-offering-id="${offeringId}">
                Assign
            </button>
        </div>
    `).join("");
}

//MODAL CONFIRMAR ELIMINAR PROFESOR
export function renderRemoveProfessorConfirmModal(professorName, subjectName, assignmentId, offeringId) {
    // Eliminar modal existente si lo hay
    const existingModal = document.querySelector(".remove-professor-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement("div");
    overlay.classList.add("remove-professor-modal-overlay");
    
    overlay.innerHTML = `
        <div class="remove-professor-modal">
            <div class="remove-professor-modal-header">
                <div class="remove-header-icon">⚠️</div>
                <h2>Remove Professor</h2>
                <button class="close-remove-professor-modal">×</button>
            </div>
            
            <div class="remove-professor-modal-body">
                <p class="remove-warning">Confirm removal</p>
                <p class="remove-confirm-text">
                    You are about to remove <strong>${escapeHtmlContent(professorName)}</strong> from 
                    <strong>${escapeHtmlContent(subjectName)}</strong>.
                </p>
                <p class="remove-info">
                    They will lose access to the course immediately.
                </p>
            </div>
            
            <div class="remove-professor-modal-footer">
                <button class="cancel-remove-professor-btn">Cancel</button>
                <button class="confirm-remove-professor-btn" 
                    data-assignment-id="${assignmentId}" 
                    data-professor-name="${escapeHtmlContent(professorName)}"
                    data-offering-id="${offeringId}">  <!-- ← AÑADIDO offeringId -->
                    Yes, Remove
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

export function closeRemoveProfessorModal() {
    const overlay = document.querySelector(".remove-professor-modal-overlay");
    if (overlay) overlay.remove();
}


// ==========================================
// ACADEMIC STRUCTURE VIEW - ADMIN
// ==========================================

export function renderAcademicStructure(subjects, academicYears, courseOfferings, activeTab = "subjects") {
    const main = document.querySelector(".content");
    if (!main) return;

    // Contar estadísticas
    const totalSubjects = subjects.length;
    const totalAcademicYears = academicYears.length;
    const totalCourseOfferings = courseOfferings.length;

    // Calcular ejercicios totales
    let totalExercises = 0;
    courseOfferings.forEach(offering => {
        totalExercises += offering.exercises_count || 0;
    });

    main.innerHTML = `
        <div class="academic-structure-page">
            <!-- HEADER -->
            <div class="academic-header">
                <h1>Academic Structure</h1>
                <p>Manage subjects, academic years and course offerings.</p>
            </div>

            <!-- TABS (ahora arriba) -->
            <div class="academic-tabs">
                <button class="academic-tab ${activeTab === 'subjects' ? 'active' : ''}" data-tab="subjects">
                    📚 Subjects
                </button>
                <button class="academic-tab ${activeTab === 'academicYears' ? 'active' : ''}" data-tab="academicYears">
                    📅 Academic Years
                </button>
                <button class="academic-tab ${activeTab === 'courseOfferings' ? 'active' : ''}" data-tab="courseOfferings">
                    📋 Course Offerings
                </button>
            </div>

            <!-- STATS CARDS (ahora debajo de las tabs) -->
            <div class="academic-stats-grid">
                <div class="academic-stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-info">
                        <span class="stat-number">${totalSubjects}</span>
                        <span class="stat-label">Subjects</span>
                    </div>
                </div>
                <div class="academic-stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-info">
                        <span class="stat-number">${totalAcademicYears}</span>
                        <span class="stat-label">Academic Years</span>
                    </div>
                </div>
                <div class="academic-stat-card">
                    <div class="stat-icon">📋</div>
                    <div class="stat-info">
                        <span class="stat-number">${totalCourseOfferings}</span>
                        <span class="stat-label">Course Offerings</span>
                    </div>
                </div>
                <div class="academic-stat-card">
                    <div class="stat-icon">✏️</div>
                    <div class="stat-info">
                        <span class="stat-number">${totalExercises}</span>
                        <span class="stat-label">Exercises</span>
                    </div>
                </div>
            </div>

            <!-- CONTENT -->
            <div class="academic-content">
                ${activeTab === 'subjects' ? renderSubjectsTab(subjects) : ''}
                ${activeTab === 'academicYears' ? renderAcademicYearsTab(academicYears) : ''}
                ${activeTab === 'courseOfferings' ? renderCourseOfferingsTab(courseOfferings, subjects, academicYears) : ''}
            </div>
        </div>
    `;
}

// En view.js, reemplazar la función renderSubjectsTab con esta:

function renderSubjectsTab(subjects) {
    if (!subjects || subjects.length === 0) {
        return `
            <div class="academic-tab-content subjects-tab">
                <div class="tab-actions-bar">
                    <div class="search-area">
                        <input type="text" id="subjectsSearchInput" placeholder="Search subjects..." class="search-input">
                    </div>
                    <div class="action-buttons">
                        <button class="template-btn2" id="downloadSubjectsTemplateBtn">📄 Download Template</button>
                        <label class="upload-btn-label2">
                            📤 Import Excel
                            <input type="file" id="uploadSubjectsExcel" accept=".xlsx" hidden>
                        </label>
                        <button class="create-btn" id="createSubjectBtn">+ Create Subject</button>
                    </div>
                </div>
                <div class="empty-state-table">
                    <p>No subjects created yet.</p>
                    <p class="hint">Click "Create Subject" to add your first subject.</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="academic-tab-content subjects-tab">
            <div class="tab-actions-bar">
                <div class="search-area">
                    <input type="text" id="subjectsSearchInput" placeholder="Search subjects..." class="search-input">
                </div>
                <div class="action-buttons">
                    <button class="template-btn2" id="downloadSubjectsTemplateBtn">📄 Download Template</button>
                    <label class="upload-btn-label2">
                        📤 Import Excel
                        <input type="file" id="uploadSubjectsExcel" accept=".xlsx" hidden>
                    </label>
                    <button class="create-btn" id="createSubjectBtn">+ Create Subject</button>
                </div>
            </div>

            <div class="subjects-table-wrapper">
                <table class="academic-table">
                    <thead>
                        <tr>
                            <th>SUBJECT</th>
                            <th>CODE</th>
                            <th>OFFERINGS</th>
                            <th>EXERCISES</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="subjectsTableBody">
                        ${subjects.map(subject => `
                            <tr>
                                <td class="subject-name-cell">
                                    <div class="subject-name">${escapeHtmlContent(subject.name)}</div>
                                    <div class="subject-description">${escapeHtmlContent(subject.description || 'No description')}</div>
                                </td>
                                <td class="subject-code-cell">SUB-${subject.id}</td>
                                <td class="offerings-count">${subject.offerings_count || 0}</td>
                                <td class="exercises-count">${subject.exercises_count || 0}</td>
                                <td class="status-cell">
                                    <span class="status-badge active">active</span>
                                </td>
                                <td class="actions-cell">
                                    <button class="edit-subject-btn" data-id="${subject.id}" data-name="${escapeHtmlContent(subject.name)}" data-description="${escapeHtmlContent(subject.description || '')}">
                                        ✏️ Edit
                                    </button>
                                    <button class="delete-subject-btn" data-id="${subject.id}" data-name="${escapeHtmlContent(subject.name)}">
                                        🗑️ Delete
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAcademicYearsTab(academicYears) {
    if (!academicYears || academicYears.length === 0) {
        return `
            <div class="academic-tab-content years-tab">
                <div class="tab-actions-bar">
                    <div class="search-area">
                        <input type="text" id="yearsSearchInput" placeholder="Search academic years..." class="search-input">
                    </div>
                    <div class="action-buttons">
                        <button class="create-btn" id="createAcademicYearBtn">+ Create Academic Year</button>
                    </div>
                </div>
                <div class="empty-state-table">
                    <p>No academic years created yet.</p>
                    <p class="hint">Click "Create Academic Year" to add one.</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="academic-tab-content years-tab">
            <div class="tab-actions-bar">
                <div class="search-area">
                    <input type="text" id="yearsSearchInput" placeholder="Search academic years..." class="search-input">
                </div>
                <div class="action-buttons">
                    <button class="create-btn" id="createAcademicYearBtn">+ Create Academic Year</button>
                </div>
            </div>

            <div class="years-table-wrapper">
                <table class="academic-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>ACADEMIC YEAR</th>
                            <th>OFFERINGS</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="yearsTableBody">
                        ${academicYears.map(year => `
                            <tr>
                                <td>${year.id}</td>
                                <td class="year-name-cell">${year.start_year}-${year.end_year}</td>
                                <td>${year.offerings_count || 0}</td>
                                <td>
                                    <span class="status-badge ${getYearStatus(year)}">${getYearStatusText(year)}</span>
                                </td>
                                <td class="actions-cell">
                                    <button class="edit-year-btn" data-id="${year.id}" data-start="${year.start_year}" data-end="${year.end_year}">
                                        ✏️ Edit
                                    </button>
                                    <button class="delete-year-btn" data-id="${year.id}" data-name="${year.start_year}-${year.end_year}">
                                        🗑️ Delete
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getYearStatus(year) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (currentMonth >= 9) {
        if (year.start_year === currentYear && year.end_year === currentYear + 1) return "current";
        if (year.start_year > currentYear) return "future";
        return "past";
    } else {
        if (year.start_year === currentYear - 1 && year.end_year === currentYear) return "current";
        if (year.start_year > currentYear - 1) return "future";
        return "past";
    }
}

function getYearStatusText(year) {
    const status = getYearStatus(year);
    if (status === "current") return "Current";
    if (status === "future") return "Future";
    return "Past";
}

// view.js - Actualizar renderCourseOfferingsTab (SIN botón superior)

function renderCourseOfferingsTab(courseOfferings, subjects, academicYears) {
    const subjectMap = new Map();
    subjects.forEach(s => subjectMap.set(s.id, s.name));

    const academicYearMap = new Map();
    academicYears.forEach(y => academicYearMap.set(y.id, `${y.start_year}-${y.end_year}`));

    if (!courseOfferings || courseOfferings.length === 0) {
        return `
            <div class="academic-tab-content offerings-tab">
                <div class="tab-actions-bar">
                    <div class="search-area">
                        <input type="text" id="offeringsSearchInput" placeholder="Search course offerings..." class="search-input">
                    </div>
                    <div class="action-buttons">
                        <button class="template-btn2" id="downloadOfferingsTemplateBtn">📄 Download Template</button>
                        <label class="upload-btn-label2">
                            📤 Import Excel
                            <input type="file" id="uploadOfferingsExcel" accept=".xlsx" hidden>
                        </label>
                        <button class="create-btn" id="createOfferingBtn">+ Create Offering</button>
                    </div>
                </div>
                <div class="empty-state-table">
                    <p>No course offerings created yet.</p>
                    <p class="hint">Click "Create Offering" to add one.</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="academic-tab-content offerings-tab">
            <div class="tab-actions-bar">
                <div class="search-area">
                    <input type="text" id="offeringsSearchInput" placeholder="Search course offerings..." class="search-input">
                </div>
                <div class="action-buttons">
                    <button class="template-btn2" id="downloadOfferingsTemplateBtn">📄 Download Template</button>
                    <label class="upload-btn-label2">
                        📤 Import Excel
                        <input type="file" id="uploadOfferingsExcel" accept=".xlsx" hidden>
                    </label>
                    <button class="create-btn" id="createOfferingBtn">+ Create Offering</button>
                </div>
            </div>

            <div class="offerings-table-wrapper">
                <table class="academic-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>SUBJECT</th>
                            <th>ACADEMIC YEAR</th>
                            <th>EXERCISES</th>
                            <th>STUDENTS</th>
                            <th>TEACHERS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="offeringsTableBody">
                        ${courseOfferings.map(offering => `
                            <tr>
                                <td>${offering.id}</td>
                                <td class="offering-subject-cell">
                                    <strong>${escapeHtmlContent(offering.subject_name || subjectMap.get(offering.subject_id) || 'Unknown')}</strong>
                                </td>
                                <td>${offering.academic_year || academicYearMap.get(offering.academic_year_id) || '—'}</td>
                                <td>${offering.exercises_count || 0}</td>
                                <td>${offering.students_count || 0}</td>
                                <td>${offering.teachers_count || 0}</td>
                                <td class="actions-cell">
                                    <button class="edit-offering-btn" 
                                        data-id="${offering.id}" 
                                        data-subject-id="${offering.subject_id}" 
                                        data-year-id="${offering.academic_year_id}"
                                        title="Edit Offering">
                                        ✏️ Edit
                                    </button>
                                    <button class="duplicate-offering-btn" 
                                        data-id="${offering.id}" 
                                        data-subject="${escapeHtmlContent(offering.subject_name || 'Unknown')}" 
                                        data-year="${offering.academic_year || '—'}"
                                        title="Duplicate Offering">
                                        🔄 Duplicate
                                    </button>
                                    <button class="delete-offering-btn" data-id="${offering.id}" data-subject="${escapeHtmlContent(offering.subject_name || 'Unknown')}" data-year="${offering.academic_year || '—'}">
                                        🗑️ Delete
                                    </button>
                                 </div>
                            </td>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
// ==========================================
// MODALES PARA ACADEMIC STRUCTURE
// ==========================================

export function renderCreateSubjectModal() {
    removeExistingModal();

    const overlay = document.createElement("div");
    overlay.className = "academic-modal-overlay";
    overlay.innerHTML = `
        <div class="academic-modal">
            <div class="academic-modal-header">
                <h2>Create Subject</h2>
                <button class="close-modal">×</button>
            </div>
            <div class="academic-modal-body">
                <div class="form-group">
                    <label>Subject Name <span class="required">*</span></label>
                    <input type="text" id="modalSubjectName" placeholder="e.g., Algorithms, Data Structures" class="form-input">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="modalSubjectDescription" rows="4" placeholder="Enter a description for this subject..." class="form-textarea"></textarea>
                </div>
            </div>
            <div class="academic-modal-footer">
                <button class="cancel-modal-btn">Cancel</button>
                <button class="confirm-modal-btn" id="confirmCreateSubjectBtn">Create Subject</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    console.log("Modal appended to body");
}

export function renderEditSubjectModal(subjectId, currentName, currentDescription) {
    removeExistingModal();

    const overlay = document.createElement("div");
    overlay.className = "academic-modal-overlay";
    overlay.innerHTML = `
        <div class="academic-modal">
            <div class="academic-modal-header">
                <h2>Edit Subject</h2>
                <button class="close-modal">×</button>
            </div>
            <div class="academic-modal-body">
                <div class="form-group">
                    <label>Subject Name <span class="required">*</span></label>
                    <input type="text" id="modalSubjectName" value="${escapeHtmlContent(currentName)}" class="form-input">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="modalSubjectDescription" rows="4" placeholder="Enter a description for this subject..." class="form-textarea">${escapeHtmlContent(currentDescription)}</textarea>
                </div>
            </div>
            <div class="academic-modal-footer">
                <button class="cancel-modal-btn">Cancel</button>
                <button class="confirm-modal-btn" id="confirmEditSubjectBtn" data-id="${subjectId}">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

export function renderCreateAcademicYearModal() {
    removeExistingModal();

    const currentYear = new Date().getFullYear();

    const overlay = document.createElement("div");
    overlay.className = "academic-modal-overlay";
    overlay.innerHTML = `
        <div class="academic-modal">
            <div class="academic-modal-header">
                <h2>Create Academic Year</h2>
                <button class="close-modal">×</button>
            </div>
            <div class="academic-modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Year <span class="required">*</span></label>
                        <input type="number" id="modalStartYear" value="${currentYear}" class="form-input" min="2000" max="2100">
                    </div>
                    <div class="form-group">
                        <label>End Year <span class="required">*</span></label>
                        <input type="number" id="modalEndYear" value="${currentYear + 1}" class="form-input" min="2000" max="2100">
                    </div>
                </div>
                <p class="form-hint">Example: 2025-2026 represents the academic year starting in 2025 and ending in 2026.</p>
            </div>
            <div class="academic-modal-footer">
                <button class="cancel-modal-btn">Cancel</button>
                <button class="confirm-modal-btn" id="confirmCreateYearBtn">Create Academic Year</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

export function renderEditAcademicYearModal(yearId, currentStart, currentEnd) {
    removeExistingModal();

    const overlay = document.createElement("div");
    overlay.className = "academic-modal-overlay";
    overlay.innerHTML = `
        <div class="academic-modal">
            <div class="academic-modal-header">
                <h2>Edit Academic Year</h2>
                <button class="close-modal">×</button>
            </div>
            <div class="academic-modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Year <span class="required">*</span></label>
                        <input type="number" id="modalStartYear" value="${currentStart}" class="form-input" min="2000" max="2100">
                    </div>
                    <div class="form-group">
                        <label>End Year <span class="required">*</span></label>
                        <input type="number" id="modalEndYear" value="${currentEnd}" class="form-input" min="2000" max="2100">
                    </div>
                </div>
            </div>
            <div class="academic-modal-footer">
                <button class="cancel-modal-btn">Cancel</button>
                <button class="confirm-modal-btn" id="confirmEditYearBtn" data-id="${yearId}">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

export function renderCreateCourseOfferingModal(subjects, academicYears) {
    removeExistingModal();

    const overlay = document.createElement("div");
    overlay.className = "academic-modal-overlay";
    overlay.innerHTML = `
        <div class="academic-modal">
            <div class="academic-modal-header">
                <h2>Create Course Offering</h2>
                <button class="close-modal">×</button>
            </div>
            <div class="academic-modal-body">
                <div class="form-group">
                    <label>Subject <span class="required">*</span></label>
                    <select id="modalSubjectId" class="form-select">
                        <option value="">Select a subject...</option>
                        ${subjects.map(s => `<option value="${s.id}">${escapeHtmlContent(s.name)}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label>Academic Year <span class="required">*</span></label>
                    <select id="modalAcademicYearId" class="form-select">
                        <option value="">Select an academic year...</option>
                        ${academicYears.map(y => `<option value="${y.id}">${y.start_year}-${y.end_year}</option>`).join("")}
                    </select>
                </div>
                <div class="info-box">
                    <span class="info-icon">ℹ️</span>
                    <p>A course offering links a subject to an academic year. You can add exercises and assign professors after creation.</p>
                </div>
            </div>
            <div class="academic-modal-footer">
                <button class="cancel-modal-btn">Cancel</button>
                <button class="confirm-modal-btn" id="confirmCreateOfferingBtn">Create Offering</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

function removeExistingModal() {
    const existing = document.querySelector(".academic-modal-overlay");
    if (existing) existing.remove();
}


export function closeAcademicModal() {
    const overlay = document.querySelector(".academic-modal-overlay");
    if (overlay) overlay.remove();
}

export function closeSubjectModal() {
    const overlay = document.querySelector(".academic-modal-overlay");
    if (overlay) overlay.remove();
}

export function renderDeleteSubjectConfirmModal(subjectId, subjectName) {
    // Eliminar modal existente si lo hay
    const existingModal = document.querySelector(".delete-subject-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement("div");
    overlay.classList.add("delete-subject-modal-overlay");
    
    overlay.innerHTML = `
        <div class="delete-subject-modal">
            <div class="delete-subject-modal-header">
                <div class="delete-header-icon">⚠️</div>
                <h2>Delete Subject</h2>
                <button class="close-delete-subject-modal">×</button>
            </div>
            
            <div class="delete-subject-modal-body">
                <p class="delete-warning">This action cannot be undone.</p>
                <p class="delete-confirm-text">
                    You are about to delete the subject <strong>${escapeHtmlContent(subjectName)}</strong>.
                </p>
                <p class="delete-info">
                    This will delete all course offerings, exercises, submissions and evaluations associated with this subject.
                </p>
            </div>
            
            <div class="delete-subject-modal-footer">
                <button class="cancel-delete-subject-btn">Cancel</button>
                <button class="confirm-delete-subject-btn" 
                    data-subject-id="${subjectId}" 
                    data-subject-name="${escapeHtmlContent(subjectName)}">
                    Yes, Delete
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

export function closeDeleteSubjectModal() {
    const overlay = document.querySelector(".delete-subject-modal-overlay");
    if (overlay) overlay.remove();
}


// ==========================================
// FILTRO DE TABLAS PARA ADMIN (ACADEMIC STRUCTURE)
// ==========================================

/* Filtrar tabla de asignaturas en tiempo real (como searchCoursesController) */
export function filterSubjectsTableView(searchTerm) {
    const tableBody = document.getElementById("subjectsTableBody");
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll("tr");
    const searchLower = searchTerm.trim().toLowerCase();
    
    rows.forEach(row => {        if (row.querySelector('td[colspan]')) return;
        
        const nameCell = row.querySelector(".subject-name");
        const codeCell = row.querySelector(".subject-code-cell");
        
        const name = nameCell?.textContent.toLowerCase() || "";
        const code = codeCell?.textContent.toLowerCase() || "";
        
        let matches = false;
        
        if (searchTerm.trim() === "") {
            matches = true;
        } else {
            // 1. Buscar en el nombre completo
            const fullNameMatches = name.startsWith(searchLower);
            
            // 2. Dividir el nombre en palabras y buscar en cada palabra
            const nameWords = name.split(/\s+/);
            const anyWordMatches = nameWords.some(word => word.startsWith(searchLower));
            
            // 3. Buscar en el código (ej: SUB-1, SUB-2)
            const codeMatches = code.startsWith(searchLower);
            
            matches = fullNameMatches || anyWordMatches || codeMatches;
        }
        
        row.style.display = matches ? "" : "none";
    });
}

/* Filtrar tabla de años académicos en tiempo real */
export function filterAcademicYearsTableView(searchTerm) {
    const tableBody = document.getElementById("yearsTableBody");
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll("tr");
    const searchLower = searchTerm.trim().toLowerCase();
    
    rows.forEach(row => {
        if (row.querySelector('td[colspan]')) return;
        
        const yearCell = row.querySelector(".year-name-cell");
        const idCell = row.querySelector("td:first-child");
        
        const yearName = yearCell?.textContent.toLowerCase() || "";
        const yearId = idCell?.textContent.toLowerCase() || "";
        
        let matches = false;
        
        if (searchTerm.trim() === "") {
            matches = true;
        } else {
            const yearNameMatches = yearName.includes(searchLower);
            const yearIdMatches = yearId.startsWith(searchLower);
            matches = yearNameMatches || yearIdMatches;
        }
        
        row.style.display = matches ? "" : "none";
    });
}

/* Filtrar tabla de course offerings en tiempo real */
export function filterCourseOfferingsTableView(searchTerm) {
    const tableBody = document.getElementById("offeringsTableBody");
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll("tr");
    const searchLower = searchTerm.trim().toLowerCase();
    
    rows.forEach(row => {
        if (row.querySelector('td[colspan]')) return;
        
        const subjectCell = row.querySelector(".offering-subject-cell strong");
        const yearCell = row.querySelector("td:nth-child(3)");
        const idCell = row.querySelector("td:first-child");
        
        const subjectName = subjectCell?.textContent.toLowerCase() || "";
        const yearName = yearCell?.textContent.toLowerCase() || "";
        const offeringId = idCell?.textContent.toLowerCase() || "";
        
        let matches = false;
        
        if (searchTerm.trim() === "") {
            matches = true;
        } else {
            // 1. Buscar en el nombre de la asignatura (como searchCoursesController)
            const fullNameMatches = subjectName.startsWith(searchLower);
            const nameWords = subjectName.split(/\s+/);
            const anyWordMatches = nameWords.some(word => word.startsWith(searchLower));
            
            // 2. Buscar en el año académico
            const yearMatches = yearName.startsWith(searchLower);
            const yearParts = yearName.split(/[-/]/);
            const anyYearPartMatches = yearParts.some(part => part.startsWith(searchLower));
            
            // 3. Buscar en ID
            const idMatches = offeringId.startsWith(searchLower);
            
            matches = fullNameMatches || anyWordMatches || yearMatches || anyYearPartMatches || idMatches;
        }
        
        row.style.display = matches ? "" : "none";
    });
}

// MODAL CONFIRMAR ELIMINAR AÑO ACADÉMICO
export function renderDeleteAcademicYearConfirmModal(yearId, yearName, offeringsCount) {
    // Eliminar modal existente si lo hay
    const existingModal = document.querySelector(".delete-academic-year-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement("div");
    overlay.classList.add("delete-academic-year-modal-overlay");
    
    // Determinar mensaje según si tiene ofertas o no
    const hasOfferings = offeringsCount > 0;
    const warningClass = hasOfferings ? "delete-warning-error" : "delete-warning";
    const warningIcon = hasOfferings ? "⚠️" : "⚠️";
    const warningText = hasOfferings 
        ? `Cannot delete - ${offeringsCount} course offering(s) are linked`
        : "This action cannot be undone.";
    
    const additionalInfo = hasOfferings
        ? `<p class="delete-info-error">You must first delete all course offerings associated with this academic year before deleting it.</p>`
        : `<p class="delete-info">This will delete all course offerings, exercises, submissions and evaluations associated with this academic year.</p>`;
    
    const confirmButtonDisabled = hasOfferings ? "disabled" : "";
    const confirmButtonStyle = hasOfferings ? 'opacity: 0.6; cursor: not-allowed; background: #9ca3af;' : '';
    
    overlay.innerHTML = `
        <div class="delete-academic-year-modal">
            <div class="delete-academic-year-modal-header">
                <div class="delete-header-icon">${warningIcon}</div>
                <h2>Delete Academic Year</h2>
                <button class="close-delete-academic-year-modal">×</button>
            </div>
            
            <div class="delete-academic-year-modal-body">
                <p class="${warningClass}">${warningText}</p>
                <p class="delete-confirm-text">
                    You are about to delete the academic year <strong>${escapeHtmlContent(yearName)}</strong>.
                </p>
                ${additionalInfo}
            </div>
            
            <div class="delete-academic-year-modal-footer">
                <button class="cancel-delete-academic-year-btn">Cancel</button>
                <button class="confirm-delete-academic-year-btn" 
                    data-year-id="${yearId}" 
                    data-year-name="${escapeHtmlContent(yearName)}"
                    ${confirmButtonDisabled}
                    style="${confirmButtonStyle}">
                    Yes, Delete
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

export function closeDeleteAcademicYearModal() {
    const overlay = document.querySelector(".delete-academic-year-modal-overlay");
    if (overlay) overlay.remove();
}

// ==========================================
// MODAL CONFIRMAR ELIMINAR COURSE OFFERING
// ==========================================

export function renderDeleteCourseOfferingConfirmModal(offeringId, subjectName, academicYear) {
    // Eliminar modal existente si lo hay
    const existingModal = document.querySelector(".delete-course-offering-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement("div");
    overlay.classList.add("delete-course-offering-modal-overlay");  
    
    overlay.innerHTML = `
        <div class="delete-course-offering-modal">
            <div class="delete-course-offering-modal-header">  
                <div class="delete-header-icon">⚠️</div>
                <h2>Delete Course Offering</h2>
                <button class="close-delete-course-offering-modal">×</button> 
            </div>
            
            <div class="delete-course-offering-modal-body"> 
                <p class="delete-warning">This action cannot be undone.</p>
                <p class="delete-confirm-text">
                    You are about to delete the course offering for <strong>${escapeHtmlContent(subjectName)}</strong> 
                    (${escapeHtmlContent(academicYear)}).
                </p>
                <p class="delete-info">
                    This will delete all exercises, submissions and evaluations associated with this course offering.
                </p>
            </div>
            
            <div class="delete-course-offering-modal-footer">  
                <button class="cancel-delete-course-offering-btn">Cancel</button>  
                <button class="confirm-delete-course-offering-btn"   
                    data-offering-id="${offeringId}" 
                    data-subject-name="${escapeHtmlContent(subjectName)}"
                    data-academic-year="${escapeHtmlContent(academicYear)}">
                    Yes, Delete
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

export function closeDeleteCourseOfferingModal() {
    const overlay = document.querySelector(".delete-course-offering-modal-overlay");  
    if (overlay) overlay.remove();
}


/* Renderizar modal para editar course offering */
export function renderEditCourseOfferingModal(offeringId, currentSubjectId, currentAcademicYearId, subjects, academicYears) {
    // Eliminar modal existente
    removeExistingModal();

    const overlay = document.createElement("div");
    overlay.className = "academic-modal-overlay";
    overlay.innerHTML = `
        <div class="academic-modal">
            <div class="academic-modal-header">
                <h2>Edit Course Offering</h2>
                <button class="close-modal">×</button>
            </div>
            <div class="academic-modal-body">
                <div class="form-group">
                    <label>Subject <span class="required">*</span></label>
                    <select id="modalSubjectId" class="form-select">
                        <option value="">Select a subject...</option>
                        ${subjects.map(s => `<option value="${s.id}" ${s.id === currentSubjectId ? 'selected' : ''}>${escapeHtmlContent(s.name)}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label>Academic Year <span class="required">*</span></label>
                    <select id="modalAcademicYearId" class="form-select">
                        <option value="">Select an academic year...</option>
                        ${academicYears.map(y => `<option value="${y.id}" ${y.id === currentAcademicYearId ? 'selected' : ''}>${y.start_year}-${y.end_year}</option>`).join("")}
                    </select>
                </div>
                <div class="info-box">
                    <span class="info-icon">ℹ️</span>
                    <p>Changing the subject or academic year will update this course offering.</p>
                </div>
            </div>
            <div class="academic-modal-footer">
                <button class="cancel-modal-btn">Cancel</button>
                <button class="confirm-modal-btn" id="confirmEditOfferingBtn" data-id="${offeringId}">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

// ==========================================
// DUPLICATE COURSE OFFERING - ADMIN MODAL
// ==========================================

export function renderAdminDuplicateCourseOfferingModal(selectedOffering, targetAcademicYears, currentAcademicYear) {
    // Eliminar modal existente
    const existingModal = document.querySelector(".admin-duplicate-modal-overlay");
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement("div");
    overlay.classList.add("admin-duplicate-modal-overlay");
    overlay.id = "adminDuplicateModalOverlay";
    
    // Años destino
    const targetYearsHTML = targetAcademicYears.map(year => {
        return `<option value="${year.id}" ${year.start_year === (currentAcademicYear?.start_year + 1) ? 'selected' : ''}>${year.start_year}-${year.end_year}</option>`;
    }).join("");
    
    // Estadísticas de la oferta seleccionada
    const exercisesCount = selectedOffering?.exercises_count || 0;
    const testCasesCount = selectedOffering?.test_cases_count || 0;
    const rubricCount = selectedOffering?.rubric_criteria_count || 0;
    const languagesCount = selectedOffering?.languages_count || 0;
    const sourceYear = selectedOffering?.academic_year || "2024-2025";
    const subjectName = selectedOffering?.subject_name || selectedOffering?.subject?.name || "-";
    
    overlay.innerHTML = `
        <div class="admin-duplicate-modal">
            <div class="admin-duplicate-header">
                <h2>Duplicate Course Offering</h2>
                <button class="close-admin-duplicate-modal" id="closeAdminDuplicateModalBtn">×</button>
            </div>
            
            <!-- STEP INDICATOR (2 pasos) -->
            <div class="admin-duplicate-steps">
                <div class="step-indicator">
                    <div class="step active" data-step="1">
                        <span class="step-number">1</span>
                        <span class="step-label">Target Year</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step" data-step="2">
                        <span class="step-number">2</span>
                        <span class="step-label">Review</span>
                    </div>
                </div>
            </div>
            
            <div class="admin-duplicate-body">
                <!-- STEP 1: Seleccionar año destino -->
                <div class="step-content step-1 active" id="adminStep1Content">
                    <div class="selected-source-info">
                        <span class="source-label">Source:</span>
                        <span class="source-value">${escapeHtmlContent(subjectName)} · ${escapeHtmlContent(sourceYear)}</span>
                    </div>
                    
                    <div class="form-group">
                        <label>Target Academic Year <span class="required">*</span></label>
                        <select id="adminTargetAcademicYearSelect" class="config-select">
                            <option value="">Select academic year...</option>
                            ${targetYearsHTML}
                        </select>
                    </div>
                    
                    <div class="duplication-preview">
                        <div class="preview-title">What will be duplicated</div>
                        <div class="preview-stats">
                            <div class="preview-stat">
                                <span class="stat-number">${exercisesCount}</span>
                                <span class="stat-label">Exercises</span>
                            </div>
                            <div class="preview-stat">
                                <span class="stat-number">${testCasesCount}</span>
                                <span class="stat-label">Test Cases</span>
                            </div>
                            <div class="preview-stat">
                                <span class="stat-number">${rubricCount}</span>
                                <span class="stat-label">Rubric Criteria</span>
                            </div>
                            <div class="preview-stat">
                                <span class="stat-number">${languagesCount}</span>
                                <span class="stat-label">Languages</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-1-footer">
                        <button class="cancel-duplicate-btn" id="adminCancelDuplicateBtn">Cancel</button>
                        <button class="next-step-btn" id="adminStep1NextBtn" disabled>Next</button>
                    </div>
                </div>
                
                <!-- STEP 2: Review y Confirmar -->
                <div class="step-content step-2" id="adminStep2Content">
                    <div class="selected-source-info">
                        <span class="source-label">Source:</span>
                        <span class="source-value">${escapeHtmlContent(subjectName)} · ${escapeHtmlContent(sourceYear)}</span>
                    </div>
                    
                    <div class="review-stats">
                        <div class="review-title">What will be duplicated</div>
                        <div class="review-grid">
                            <div class="review-item">
                                <span class="review-number">${exercisesCount}</span>
                                <span class="review-label">Exercises</span>
                            </div>
                            <div class="review-item">
                                <span class="review-number">${testCasesCount}</span>
                                <span class="review-label">Test Cases</span>
                            </div>
                            <div class="review-item">
                                <span class="review-number">${rubricCount}</span>
                                <span class="review-label">Rubric Criteria</span>
                            </div>
                            <div class="review-item">
                                <span class="review-number">${languagesCount}</span>
                                <span class="review-label">Languages</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="course-details-preview">
                        <div class="detail-row">
                            <span class="detail-label">Subject</span>
                            <span class="detail-value" id="reviewSubject">${escapeHtmlContent(subjectName)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Year</span>
                            <span class="detail-value" id="reviewYear">-</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status</span>
                            <span class="detail-value">Draft</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Students</span>
                            <span class="detail-value">0 (not copied)</span>
                        </div>
                    </div>
                    
                    <div class="step-2-footer">
                        <button class="back-step-btn" id="adminStep2BackBtn">Back</button>
                        <button class="confirm-duplicate-btn" id="adminConfirmDuplicateBtn" disabled>Duplicate Offering</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/* Renderizar lista de ofertas para Admin */
function renderAdminOfferingsList(offerings) {
    if (!offerings || offerings.length === 0) {
        return `<div class="empty-offerings-message"><p>No course offerings available</p></div>`;
    }
    
    return offerings.map(offering => {
        const yearDisplay = offering.academic_year || "-";
        
        return `
            <div class="admin-duplicate-offering-card" data-offering-id="${offering.id}">
                <div class="offering-card-header">
                    <div class="offering-icon">
                        <img src="src/img/courses.png" class="offering-icon-img">
                    </div>
                    <div class="offering-info">
                        <h3 class="offering-title">${escapeHtmlContent(offering.subject?.name || offering.subject_name || "-")}</h3>
                        <p class="offering-meta">${escapeHtmlContent(yearDisplay)}</p>
                    </div>
                </div>
                <div class="offering-stats">
                    <div class="stat-item">
                        <span class="stat-number">${offering.exercises_count || 0}</span>
                        <span class="stat-label">exercises</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${offering.test_cases_count || 0}</span>
                        <span class="stat-label">test cases</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${offering.rubric_criteria_count || 0}</span>
                        <span class="stat-label">rubric criteria</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${offering.languages_count || 0}</span>
                        <span class="stat-label">languages</span>
                    </div>
                </div>
                <button class="select-offering-btn" data-offering-id="${offering.id}">Select</button>
            </div>
        `;
    }).join("");
}

/* Actualizar resumen de oferta seleccionada (Admin) */
export function updateAdminSelectedOfferingSummary(offering) {
    const summaryDiv = document.getElementById("adminSelectedOfferingSummary");
    if (!summaryDiv || !offering) return;
    
    const yearDisplay = offering.academic_year || "-";
    
    summaryDiv.innerHTML = `
        <div class="selected-offering-badge">
            <span class="badge-icon">📋</span>
            <span class="badge-text">Source: ${escapeHtmlContent(offering.subject?.name || offering.subject_name || "-")} · ${escapeHtmlContent(yearDisplay)}</span>
        </div>
    `;
    
    // Actualizar estadísticas
    document.getElementById("adminStatExercises").textContent = offering.exercises_count || 0;
    document.getElementById("adminStatTestCases").textContent = offering.test_cases_count || 0;
    document.getElementById("adminStatRubrics").textContent = offering.rubric_criteria_count || 0;
    document.getElementById("adminStatLanguages").textContent = offering.languages_count || 0;
    
    // Actualizar info
    document.getElementById("adminInfoSubject").textContent = offering.subject?.name || offering.subject_name || "-";
    document.getElementById("adminInfoSourceYear").textContent = yearDisplay;
}

/* Actualizar lista de ofertas (Admin) */
export function updateAdminOfferingsList(offerings) {
    const container = document.getElementById("adminOfferingsList");
    if (container) {
        container.innerHTML = renderAdminOfferingsList(offerings);
    }
}

/* Actualizar UI del modal (Admin) */
export function updateAdminDuplicateModalUI(data) {
    const overlay = document.querySelector("#adminDuplicateModalOverlay");
    if (!overlay) return;
    
    // Actualizar pasos
    const steps = overlay.querySelectorAll('.step');
    steps.forEach((stepEl, idx) => {
        const stepNum = idx + 1;
        stepEl.classList.remove('active', 'completed');
        if (stepNum < data.currentStep) stepEl.classList.add('completed');
        if (stepNum === data.currentStep) stepEl.classList.add('active');
    });
    
    // Mostrar contenido del paso actual
    const contents = overlay.querySelectorAll('.step-content');
    contents.forEach((content, idx) => {
        if (idx + 1 === data.currentStep) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Actualizar botón siguiente
    const nextBtn = overlay.querySelector('#adminStep1NextBtn');
    if (nextBtn) nextBtn.disabled = !data.selectedOffering;
    
    // Actualizar selector de año destino
    const targetSelect = overlay.querySelector("#adminTargetAcademicYearSelect");
    if (targetSelect && data.targetYearId) {
        targetSelect.value = data.targetYearId;
    }
    
    updateAdminConfirmButtonState();
}

/* Actualizar el estado del botón de confirmación en paso 2 */
export function updateAdminConfirmButtonState() {
    const confirmBtn = document.getElementById("adminConfirmDuplicateBtn");
    const targetSelect = document.getElementById("adminTargetAcademicYearSelect");
    
    if (confirmBtn && targetSelect) {
        confirmBtn.disabled = !(targetSelect.value && targetSelect.value !== "");
    }
}

/* Cerrar modal (Admin) */
export function closeAdminDuplicateModalView() {
    const overlay = document.querySelector("#adminDuplicateModalOverlay");
    if (overlay) overlay.remove();
}

/* Set loading en botón de confirmación (Admin) */
export function setAdminConfirmButtonLoading(isLoading) {
    const overlay = document.querySelector("#adminDuplicateModalOverlay");
    if (!overlay) return;
    
    const confirmBtn = overlay.querySelector("#adminConfirmDuplicateBtn");
    if (confirmBtn) {
        if (isLoading) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '⏳ Duplicating...';
        } else {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Duplicate Offering';
        }
    }
}


/* Actualizar el resumen en el paso 2 (año destino) */
export function updateAdminReviewSummary(targetYearName) {
    const reviewYearSpan = document.getElementById("reviewYear");
    if (reviewYearSpan) {
        reviewYearSpan.textContent = targetYearName || "-";
    }
}

/* Actualizar estadísticas en el paso 1 cuando cambia la oferta */
export function updateAdminStep1Stats(offering) {
    if (!offering) return;
    
    const exercisesCount = offering.exercises_count || 0;
    const testCasesCount = offering.test_cases_count || 0;
    const rubricCount = offering.rubric_criteria_count || 0;
    const languagesCount = offering.languages_count || 0;
    const sourceYear = offering.academic_year || "-";
    const subjectName = offering.subject_name || offering.subject?.name || "-";
    
    // Actualizar fuente
    const sourceSpan = document.querySelector("#adminStep1Content .source-value, #adminStep2Content .source-value");
    if (sourceSpan) {
        sourceSpan.textContent = `${subjectName} · ${sourceYear}`;
    }
    
    // Actualizar estadísticas en paso 1
    const statNumbers = document.querySelectorAll("#adminStep1Content .preview-stat .stat-number");
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = exercisesCount;
        statNumbers[1].textContent = testCasesCount;
        statNumbers[2].textContent = rubricCount;
        statNumbers[3].textContent = languagesCount;
    }
    
    // Actualizar estadísticas en paso 2
    const reviewNumbers = document.querySelectorAll("#adminStep2Content .review-item .review-number");
    if (reviewNumbers.length >= 4) {
        reviewNumbers[0].textContent = exercisesCount;
        reviewNumbers[1].textContent = testCasesCount;
        reviewNumbers[2].textContent = rubricCount;
        reviewNumbers[3].textContent = languagesCount;
    }
    
    // Actualizar subject en paso 2
    const reviewSubject = document.getElementById("reviewSubject");
    if (reviewSubject) {
        reviewSubject.textContent = subjectName;
    }
}

/* Habilitar/deshabilitar botón Next según año seleccionado */
export function updateAdminStep1NextButton() {
    const targetSelect = document.getElementById("adminTargetAcademicYearSelect");
    const nextBtn = document.getElementById("adminStep1NextBtn");
    
    if (nextBtn && targetSelect) {
        nextBtn.disabled = !(targetSelect.value && targetSelect.value !== "");
    }
}


/* ==========================================
   USER MANAGEMENT VIEW - ADMIN
========================================== */

/* Renderizar página completa de gestión de usuarios */
export function renderUserManagement(users, roleCounts) {
    const main = document.querySelector(".content");
    if (!main) return;

    const admins = roleCounts?.admins || 0;
    const professors = roleCounts?.professors || 0;
    const students = roleCounts?.students || 0;
    const totalUsers = users.length;

    const activeUsers = users.filter(u => u.active_sessions > 0).length;
    const inactiveUsers = users.filter(u => u.active_sessions === 0).length;

    main.innerHTML = `
        <div class="user-management-page">
            <!-- Header -->
            <div class="user-management-header">
                <h1>User Management</h1>
                <p>Manage accounts, roles, and access across the platform.</p>
            </div>

            <!-- Stats Cards -->
            <div class="user-stats-grid">
                <div class="user-stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <span class="stat-number">${totalUsers}</span>
                        <span class="stat-label">Total Users</span>
                    </div>
                </div>
                <div class="user-stat-card">
                    <div class="stat-icon">🛡️</div>
                    <div class="stat-info">
                        <span class="stat-number">${admins}</span>
                        <span class="stat-label">Admins</span>
                    </div>
                </div>
                <div class="user-stat-card">
                    <div class="stat-icon">👨‍🏫</div>
                    <div class="stat-info">
                        <span class="stat-number">${professors}</span>
                        <span class="stat-label">Professors</span>
                    </div>
                </div>
                <div class="user-stat-card">
                    <div class="stat-icon">👨‍🎓</div>
                    <div class="stat-info">
                        <span class="stat-number">${students}</span>
                        <span class="stat-label">Students</span>
                    </div>
                </div>
                <div class="user-stat-card">
                    <div class="stat-icon">🟢</div>
                    <div class="stat-info">
                        <span class="stat-number">${activeUsers}</span>
                        <span class="stat-label">Active</span>
                    </div>
                </div>
                <div class="user-stat-card">
                    <div class="stat-icon">⭕</div>
                    <div class="stat-info">
                        <span class="stat-number">${inactiveUsers}</span>
                        <span class="stat-label">Inactive</span>
                    </div>
                </div>
            </div>

            <!-- Actions Bar con FILTROS EN BOTONES (inline) -->
            <div class="user-actions-bar">
                <div class="user-search-area">
                    <input type="text" id="userSearchInput" placeholder="Search by name or email..." class="search-input">
                </div>
                
                <!-- Grupo de filtros con botones -->
                <div class="user-filters-group">
                    <!-- Filtro por Rol -->
                    <div class="filter-buttons-role">
                        <button class="filter-role-btn active" data-role="">All</button>
                        <button class="filter-role-btn" data-role="admin">Admin</button>
                        <button class="filter-role-btn" data-role="teacher">Professor</button>
                        <button class="filter-role-btn" data-role="student">Student</button>
                        <button class="filter-role-btn" data-role="norole">No Role</button>
                    </div>
                    
                    <!-- Filtro por Estado -->
                    <div class="filter-buttons-status">
                        <button class="filter-status-btn active" data-status="">All</button>
                        <button class="filter-status-btn" data-status="active">Active</button>
                        <button class="filter-status-btn" data-status="inactive">Inactive</button>
                        <!-- Si deseas añadir "Pending", descomenta la siguiente línea -->
                        <!-- <button class="filter-status-btn" data-status="pending">Pending</button> -->
                    </div>
                </div>
                
                <div class="user-buttons-group">
                    <button class="template-btn" id="downloadUsersTemplateBtn">📄 Download Template</button>
                    <label class="upload-btn-label">
                        📤 Import Excel
                        <input type="file" id="uploadUsersExcel" accept=".xlsx" hidden>
                    </label>
                    <button class="create-user-btn" id="createUserBtn">+ Add User</button>
                </div>
            </div>

            <!-- Users Table -->
            <div class="users-table-wrapper">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>USER</th>
                            <th>EMAIL</th>
                            <th>ROLE</th>
                            <th>STATUS</th>
                            <th>SESSIONS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        ${renderUsersTableRows(users)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Guardar el total original en data attribute (opcional)
    const pageContainer = document.querySelector(".user-management-page");
    if (pageContainer) {
        pageContainer.dataset.originalTotal = totalUsers;
    }
}

// Funciones auxiliares para los labels de los filtros (se pueden mejorar después)
let currentRoleFilter = "";
let currentStatusFilter = "";

function getCurrentRoleFilterLabel() {
    if (currentRoleFilter === "admin") return "Admin";
    if (currentRoleFilter === "teacher") return "Professor";
    if (currentRoleFilter === "student") return "Student";
    return "All Roles";
}

function getCurrentStatusFilterLabel() {
    if (currentStatusFilter === "active") return "Active";
    if (currentStatusFilter === "inactive") return "Inactive";
    return "All Status";
}

/* Renderizar filas de la tabla de usuarios */
function renderUsersTableRows(users) {
    if (!users || users.length === 0) {
        return `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px;">
                    <div class="empty-state">
                        <span class="empty-icon">👥</span>
                        <p>No users found</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    return users.map(user => {
        // --- ROLE (con "No Role") ---
        let roleName = '';
        let roleClass = '';
        if (!user.role) {
            roleName = 'No Role';
            roleClass = 'no-role';  // puedes definir este estilo en CSS si quieres
        } else {
            roleName = user.role === 'teacher' ? 'Professor' : (user.role === 'admin' ? 'Admin' : 'Student');
            roleClass = user.role === 'admin' ? 'admin' : (user.role === 'teacher' ? 'teacher' : 'student');
        }
        
        // --- LAST LOGIN (usando la última sesión) ---
        let lastLogin = 'Never';
        if (user.last_session_created_at) {
            lastLogin = formatDateTime(user.last_session_created_at);
        }
        
        // --- STATUS (basado en sesiones activas) ---
        const hasActiveSessions = (user.active_sessions && user.active_sessions > 0);
        const status = hasActiveSessions ? 'active' : 'inactive';
        const statusText = hasActiveSessions ? 'Active' : 'Inactive';
        
        // --- CONTADOR DE SESIONES ---
        const sessionsCount = user.active_sessions || 0;
        const sessionsText = sessionsCount === 1 ? '1 active' : `${sessionsCount} active`;
        
        return `
            <tr data-user-id="${user.id}">
                <td class="user-name-cell">
                    <div class="user-avatar-small">${getInitials(user.name)}</div>
                    <div class="user-info">
                        <span class="user-name">${escapeHtmlContent(user.name)}</span>
                    </div>
                </td>
                <td class="user-email-cell">${escapeHtmlContent(user.email)}</td>
                <td class="user-role-cell">
                    <span class="role-badge ${roleClass}">${roleName}</span>
                </td>
                <td class="user-status-cell">
                    <span class="status-badge ${status}">${statusText}</span>
                </td>
                <td class="user-sessions-cell">
                    <button class="sessions-btn" data-user-id="${user.id}" data-user-name="${escapeHtmlContent(user.name)}" title="View sessions">
                        ${sessionsText}
                    </button>
                </td>
                <td class="user-actions-cell">
                    <button class="edit-user-btn" data-user-id="${user.id}" title="Edit user">
                        ✏️
                    </button>
                    <button class="force-password-btn" data-user-id="${user.id}" data-user-name="${escapeHtmlContent(user.name)}" title="Force password change">
                        🔑
                    </button>
                    <button class="delete-user-btn" data-user-id="${user.id}" data-user-name="${escapeHtmlContent(user.name)}" title="Delete user">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* Actualizar solo la tabla de usuarios */
export function renderUsersTable(users, totalCount) {
    const tbody = document.getElementById("usersTableBody");
    if (tbody) {
        tbody.innerHTML = renderUsersTableRows(users);
    }
    
    // Actualizar el contador total en las estadísticas
    const totalStat = document.querySelector(".user-stat-card:first-child .stat-number");
    if (totalStat) totalStat.textContent = totalCount;
}

/* Renderizar modal de crear usuario */
export function renderCreateUserModal() {
    removeExistingUserModal();
    
    const overlay = document.createElement("div");
    overlay.className = "user-modal-overlay";
    overlay.innerHTML = `
        <div class="user-modal">
            <div class="user-modal-header">
                <h2>Create New User</h2>
                <button class="close-user-modal">×</button>
            </div>
            <div class="user-modal-body">
                <div class="form-group">
                    <label>Full Name <span class="required">*</span></label>
                    <input type="text" id="userName" class="form-input" placeholder="e.g., John Doe">
                </div>
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" id="userEmail" class="form-input" placeholder="john@example.com">
                </div>
                <div class="form-group">
                    <label>Initial Password <span class="required">*</span></label>
                    <input type="password" id="userPassword" class="form-input" placeholder="Min 8 characters">
                </div>
                <div class="form-group">
                    <label>Role <span class="required">*</span></label>
                    <select id="userRole" class="form-select">
                        <option value="student">Student</option>
                        <option value="teacher">Professor</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
            <div class="user-modal-footer">
                <button class="cancel-user-modal-btn">Cancel</button>
                <button class="confirm-user-modal-btn" id="confirmCreateUserBtn">Create User</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/* Renderizar modal de editar usuario */
export function renderEditUserModal(user) {
    removeExistingUserModal();
    
    const overlay = document.createElement("div");
    overlay.className = "user-modal-overlay";
    overlay.innerHTML = `
        <div class="user-modal">
            <div class="user-modal-header">
                <h2>Edit User</h2>
                <button class="close-user-modal">×</button>
            </div>
            <div class="user-modal-body">
                <div class="form-group">
                    <label>Full Name <span class="required">*</span></label>
                    <input type="text" id="userName" class="form-input" value="${escapeHtmlContent(user.name)}">
                </div>
                <!-- ELIMINADO: campo Email (no editable) -->
                <div class="form-group">
                    <label>Role <span class="required">*</span></label>
                    <select id="userRole" class="form-select">
                        <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                        <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Professor</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        ${!user.role ? `<option value="" selected disabled>No Role</option>` : ''}
                    </select>
                </div>
                <div class="info-note">
                    <span>ℹ️</span>
                    <p>Email cannot be changed. Use "Force password change" if needed.</p>
                </div>
            </div>
            <div class="user-modal-footer">
                <button class="cancel-user-modal-btn">Cancel</button>
                <button class="confirm-user-modal-btn" id="confirmEditUserBtn" data-user-id="${user.id}">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/* Renderizar modal de confirmación para eliminar usuario */
export function renderDeleteUserConfirmModal(userId, userName) {
    removeExistingUserModal();
    
    const overlay = document.createElement("div");
    overlay.className = "user-modal-overlay";
    overlay.innerHTML = `
        <div class="user-modal user-modal-warning">
            <div class="user-modal-header warning">
                <div class="header-icon">⚠️</div>
                <h2>Delete User</h2>
                <button class="close-user-modal">×</button>
            </div>
            <div class="user-modal-body">
                <p class="delete-warning">This action cannot be undone.</p>
                <p class="delete-confirm-text">
                    You are about to delete <strong>${escapeHtmlContent(userName)}</strong>.
                </p>
                <p class="delete-info">
                    This will delete all submissions, evaluations, chat messages, and all associated data.
                </p>
            </div>
            <div class="user-modal-footer">
                <button class="cancel-user-modal-btn">Cancel</button>
                <button class="confirm-delete-user-btn" data-user-id="${userId}" data-user-name="${escapeHtmlContent(userName)}">Yes, Delete User</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/* Renderizar modal de sesiones de usuario */
export function renderUserSessionsModal(userId, userName, sessions) {
    removeExistingUserModal();
    
    const sessionsList = sessions.length === 0 
        ? '<div class="no-sessions">No active sessions found</div>'
        : sessions.map(session => `
            <div class="session-item" data-session-id="${session.id}">
                <div class="session-info">
                    <div class="session-device">
                        <span class="device-icon">${session.device === 'mobile' ? '📱' : '💻'}</span>
                        <span class="device-name">${escapeHtmlContent(session.device_name || session.user_agent || 'Unknown device')}</span>
                    </div>
                    <div class="session-details">
                        <span class="session-ip">IP: ${session.ip || session.ip_address || 'Unknown'}</span>
                        <span class="session-time">Started: ${formatDateTime(session.created_at)}</span>
                        ${session.expires_at ? `<span class="session-expires">Expires: ${formatDateTime(session.expires_at)}</span>` : ''}
                        ${session.last_activity ? `<span class="session-last">Last activity: ${formatDateTime(session.last_activity)}</span>` : ''}
                    </div>
                </div>
                <button class="revoke-session-btn" data-session-id="${session.id}" title="Revoke this session">
                    Revoke
                </button>
            </div>
        `).join("");
    
    const overlay = document.createElement("div");
    overlay.className = "user-modal-overlay sessions-modal-overlay";
    overlay.innerHTML = `
        <div class="user-modal sessions-modal">
            <div class="user-modal-header">
                <h2>Active Sessions - ${escapeHtmlContent(userName)}</h2>
                <button class="close-user-modal">×</button>
            </div>
            <div class="user-modal-body">
                <div class="sessions-list" id="sessionsList">
                    ${sessionsList}
                </div>
            </div>
            <div class="user-modal-footer">
                <button class="revoke-all-sessions-btn" data-user-id="${userId}" data-user-name="${escapeHtmlContent(userName)}">
                    Revoke All Sessions
                </button>
                <button class="cancel-user-modal-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/* Actualizar modal de sesiones (sin recargar todo) */
export function updateUserSessionsModal(sessions) {
    const sessionsList = document.getElementById("sessionsList");
    if (!sessionsList) return;
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = '<div class="no-sessions">No active sessions found</div>';
        const revokeAllBtn = document.querySelector(".revoke-all-sessions-btn");
        if (revokeAllBtn) revokeAllBtn.disabled = true;
        return;
    }
    
    sessionsList.innerHTML = sessions.map(session => `
        <div class="session-item" data-session-id="${session.id}">
            <div class="session-info">
                <div class="session-device">
                    <span class="device-icon">${session.device === 'mobile' ? '📱' : '💻'}</span>
                    <span class="device-name">${escapeHtmlContent(session.user_agent || 'Unknown device')}</span>
                </div>
                <div class="session-details">
                    <span class="session-ip">IP: ${session.ip_address || 'Unknown'}</span>
                    <span class="session-time">Started: ${new Date(session.created_at).toLocaleString()}</span>
                    ${session.last_activity ? `<span class="session-last">Last activity: ${new Date(session.last_activity).toLocaleString()}</span>` : ''}
                </div>
            </div>
            <button class="revoke-session-btn" data-session-id="${session.id}" title="Revoke this session">
                Revoke
            </button>
        </div>
    `).join("");
    
    const revokeAllBtn = document.querySelector(".revoke-all-sessions-btn");
    if (revokeAllBtn) revokeAllBtn.disabled = false;
}

/* Eliminar modal de usuario existente */
export function removeExistingUserModal() {
    const existing = document.querySelector(".user-modal-overlay");
    if (existing) existing.remove();
}
// Función para formatear fechas en general (no solo deadlines)
export function formatDateTime(dateString) {
    if (!dateString) {
        return "Never";
    }

    // Añadir "Z" para indicar que es UTC y luego convertir a local
    const date = new Date(dateString + "Z");

    return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).replace(",", "");
}
// Resaltar el botón de rol activo
export function highlightActiveRoleFilter(roleValue) {
    const buttons = document.querySelectorAll('.filter-role-btn');
    buttons.forEach(btn => {
        if (btn.dataset.role === roleValue) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Resaltar el botón de estado activo
export function highlightActiveStatusFilter(statusValue) {
    const buttons = document.querySelectorAll('.filter-status-btn');
    buttons.forEach(btn => {
        if (btn.dataset.status === statusValue) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

export function renderForcePasswordChangeModal(userId, userName) {
    // Eliminar modal existente si lo hay
    const existingModal = document.querySelector(".force-password-modal-overlay");
    if (existingModal) existingModal.remove();

    const overlay = document.createElement("div");
    overlay.classList.add("force-password-modal-overlay");

    overlay.innerHTML = `
        <div class="force-password-modal">
            <div class="force-password-modal-header">
                <div class="force-header-icon">⚠️</div>
                <h2>Forzar cambio de contraseña</h2>
                <button class="close-force-password-modal">×</button>
            </div>
            <div class="force-password-modal-body">
                <p class="force-warning">Esta acción obligará al usuario a cambiar su contraseña en el próximo inicio de sesión.</p>
                <p class="force-confirm-text">
                    ¿Estás seguro de que quieres forzar a <strong>${escapeHtmlContent(userName)}</strong> a cambiar su contraseña?
                </p>
                <p class="force-info">
                    El usuario recibirá un aviso al iniciar sesión y no podrá continuar hasta que establezca una nueva contraseña.
                </p>
            </div>
            <div class="force-password-modal-footer">
                <button class="cancel-force-password-btn">Cancelar</button>
                <button class="confirm-force-password-btn" data-user-id="${userId}" data-user-name="${escapeHtmlContent(userName)}">Sí, forzar cambio</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

// Función para cerrar el modal
export function closeForcePasswordModal() {
    const overlay = document.querySelector(".force-password-modal-overlay");
    if (overlay) overlay.remove();
}


/* Renderizar la sección de seguridad en el perfil */
export function renderPasswordSecuritySection(user) {
    // Esta función se llamará desde renderMyProfile
    // Buscamos el contenedor de estadísticas o creamos uno nuevo
    const statsCard = document.querySelector('.profile-stats-card');
    if (!statsCard) return;
    
    const lastChanged = user.last_password_change 
        ? new Date(user.last_password_change).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
          })
        : 'Never';
    
    const securityHTML = `
        <div class="profile-security-card">
            <h2>Password & Security</h2>
            <div class="security-info-row">
                <div class="security-label">Your password was last changed</div>
                <div class="security-value">${lastChanged}</div>
            </div>
            <button class="change-password-btn" id="changePasswordBtn">Change Password</button>
        </div>
    `;
    
    // Insertar después de statsCard o donde prefieras
    statsCard.insertAdjacentHTML('afterend', securityHTML);
}


/* Renderizar modal para cambiar contraseña */
export function renderChangePasswordModal() {
    // Eliminar modal existente
    const existing = document.querySelector(".change-password-modal-overlay");
    if (existing) existing.remove();
    
    const overlay = document.createElement("div");
    overlay.className = "change-password-modal-overlay";
    overlay.innerHTML = `
        <div class="change-password-modal">
            <div class="change-password-modal-header">
                <h2>Change Password</h2>
                <button class="close-change-password-modal">×</button>
            </div>
            <div class="change-password-modal-body">
                <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" id="currentPassword" class="form-input" placeholder="Enter current password">
                </div>
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" id="newPassword" class="form-input" placeholder="Min 8 characters">
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" id="confirmNewPassword" class="form-input" placeholder="Confirm new password">
                </div>
            </div>
            <div class="change-password-modal-footer">
                <button class="cancel-change-password-btn">Cancel</button>
                <button class="confirm-change-password-btn">Update Password</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

/* Cerrar modal */
export function closeChangePasswordModal() {
    const overlay = document.querySelector(".change-password-modal-overlay");
    if (overlay) overlay.remove();
}

// ==========================================
// MODAL DE CONFIRMACIÓN GENÉRICO
// ==========================================

export function renderConfirmModal(title, message, confirmText, cancelText, onConfirm, onCancel) {
    // Eliminar modal existente
    const existing = document.querySelector(".confirm-modal-overlay");
    if (existing) existing.remove();
    
    const overlay = document.createElement("div");
    overlay.className = "confirm-modal-overlay";
    overlay.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-modal-header warning">
                <div class="header-icon">⚠️</div>
                <h2>${escapeHtmlContent(title)}</h2>
                <button class="close-confirm-modal">×</button>
            </div>
            <div class="confirm-modal-body">
                <p class="confirm-warning">${escapeHtmlContent(message)}</p>
            </div>
            <div class="confirm-modal-footer">
                <button class="cancel-confirm-btn">${escapeHtmlContent(cancelText || "Cancel")}</button>
                <button class="confirm-confirm-btn">${escapeHtmlContent(confirmText || "Confirm")}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const closeModal = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
    
    overlay.querySelector(".close-confirm-modal").addEventListener("click", closeModal);
    overlay.querySelector(".cancel-confirm-btn").addEventListener("click", closeModal);
    overlay.querySelector(".confirm-confirm-btn").addEventListener("click", () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    });
    
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
    });
}


export async function renderAdminReports(reportData) {
    const main = document.querySelector(".content");
    console.log("Rendering admin reports with data:", reportData);
    
    if (!reportData || reportData.length === 0) {
        main.innerHTML = `
            <section class="reports-section">
                <div class="reports-header">
                    <h1>Analytics & Reports</h1>
                    <p>No data available yet. Students need to submit exercises.</p>
                </div>
            </section>
        `;
        return;
    }
    
    const totalSubmissions = reportData.reduce((sum, c) => sum + c.totalSubmissions, 0);
    const totalPassed = reportData.reduce((sum, c) => sum + c.totalPassed, 0);
    const totalStudents = reportData.reduce((sum, c) => sum + c.totalStudents, 0);
    const coursesWithStudents = reportData.filter(c => c.totalStudents > 0);
    const overallPassRate = coursesWithStudents.length > 0 
        ? (coursesWithStudents.reduce((sum, c) => sum + c.passRate, 0) / coursesWithStudents.length).toFixed(1)
        : 0;

    main.innerHTML = `
        <section class="reports-section">
            <div class="reports-header">
                <h1>Analytics & Reports</h1>
                <p>Platform and course performance metrics.</p>
            </div>

            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card">
                    <span class="stat-title">Total Submissions</span>
                    <h2 class="stat-number">${totalSubmissions}</h2>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Average Pass Rate</span>
                    <h2 class="stat-number">${overallPassRate}%</h2>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Total Students</span>
                    <h2 class="stat-number">${totalStudents}</h2>
                </div>
            </div>

            <div class="reports-grid">
                <div class="report-card">
                    <h2>Submissions per Course</h2>
                    <canvas id="submissionsChartAdmin"></canvas>
                </div>
                <div class="report-card">
                    <h2>Course Pass Rates (%)</h2>
                    <canvas id="passRateChartAdmin"></canvas>
                </div>
            </div>
        </section>
    `;

    const labels = reportData.map(c => c.course);
    const submissionsData = reportData.map(c => c.totalSubmissions);
    const passRates = reportData.map(c => c.passRate);

    // Gráfico de barras (Submissions per Course)
    const ctxBar = document.getElementById("submissionsChartAdmin").getContext("2d");
    new Chart(ctxBar, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Submissions",
                data: submissionsData,
                backgroundColor: "#5b4dff",
                borderRadius: 12,
                hoverBackgroundColor: "#4338ca"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw} submissions`
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1 }, 
                    grid: { color: "#e5e7eb" } 
                },
                x: { 
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 30
                    }
                }
            }
        }
    });

    // Gráfico de línea (Course Pass Rates)
    const ctxLine = document.getElementById("passRateChartAdmin").getContext("2d");
    new Chart(ctxLine, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Pass Rate",
                data: passRates,
                borderColor: "#10b981",
                backgroundColor: "#10b981",
                borderWidth: 4,
                tension: 0.4,
                fill: false,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: "#10b981",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw}% pass rate`
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: 100, 
                    ticks: { callback: (value) => value + "%" }, 
                    grid: { color: "#e5e7eb" } 
                },
                x: { 
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 30
                    }
                }
            }
        }
    });
}

/* RENDER SYSTEM CONFIG (con soporte para filtro y paginación) */
export function renderSystemConfig(services, logsData, activeTab = "services", currentPage = 1, uniqueServices = []) {
    const main = document.querySelector(".content");
    if (!main) return;

    const logs = logsData.logs || [];
    const totalLogs = logsData.total || 0;
    const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE) || 1;

    const runningCount = services.filter(s => s.status === "running").length;
    const degradedCount = services.filter(s => s.status === "degraded").length;
    const stoppedCount = services.filter(s => s.status === "stopped").length;

    main.innerHTML = `
        <div class="system-config-page">
            <div class="system-header">
                <h1>System Configuration</h1>
                <p>Monitor services and review system activity logs.</p>
            </div>

            <div class="system-tabs">
                <button class="tab-btn ${activeTab === 'services' ? 'active' : ''}" data-tab="services">
                    Services
                </button>
                <button class="tab-btn ${activeTab === 'logs' ? 'active' : ''}" data-tab="logs">
                    Activity Logs
                </button>
            </div>

            <!-- Services Tab -->
            <div id="servicesTab" class="tab-content ${activeTab === 'services' ? 'active' : ''}">
                <div class="system-stats-grid">
                    <div class="stat-card">
                        <span class="stat-title">RUNNING</span>
                        <h2 class="stat-number">${runningCount}</h2>
                    </div>
                    <div class="stat-card">
                        <span class="stat-title">DEGRADED</span>
                        <h2 class="stat-number">${degradedCount}</h2>
                    </div>
                    <div class="stat-card">
                        <span class="stat-title">STOPPED</span>
                        <h2 class="stat-number">${stoppedCount}</h2>
                    </div>
                </div>
                <div class="services-grid">
                    ${services.map(service => renderServiceCard(service)).join("")}
                </div>
            </div>

            <!-- Logs Tab -->
            <div id="logsTab" class="tab-content ${activeTab === 'logs' ? 'active' : ''}">
                <div class="logs-toolbar">
                    <div class="logs-title-section">
                        <h3>System Activity Logs</h3>
                        <span class="logs-count">${logs.length} entries (total ${totalLogs})</span>
                    </div>
                    <div class="logs-actions">
                        <select id="logsServiceFilter" class="logs-service-select">
                            <option value="">All services</option>
                            ${uniqueServices.map(s => `<option value="${escapeHtmlContent(s)}">${escapeHtmlContent(s)}</option>`).join("")}
                        </select>
                        <button class="logs-refresh-btn" id="logsRefreshBtn" title="Refresh logs">
                            ⟳ Refresh
                        </button>
                    </div>
                </div>
                <div class="logs-table-wrapper">
                    <table class="logs-table">
                        <thead>
                            <tr>
                                <th>TIMESTAMP</th>
                                <th>LEVEL</th>
                                <th>SERVICE</th>
                                <th>MESSAGE</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.length === 0 ? `
                                <tr><td colspan="4" style="text-align: center;">No logs available</td></tr>
                            ` : logs.map(log => `
                                <tr>
                                    <td class="log-timestamp">${formatLogTimestamp(log.timestamp)}</td>
                                    <td class="log-level ${log.level}">${log.level}</td>
                                    <td class="log-source">${escapeHtmlContent(log.source)}</td>
                                    <td class="log-message">${escapeHtmlContent(log.message)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
                <div class="logs-pagination">
                    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                        ← Previous
                    </button>
                    <span class="page-info">Page ${currentPage} of ${totalPages}</span>
                    <button class="pagination-btn" ${currentPage === totalPages || totalLogs === 0 ? 'disabled' : ''} data-page="${currentPage + 1}">
                        Next →
                    </button>
                </div>
            </div>
        </div>
    `;
}


/* Tarjeta de servicio mejorada (más compacta) */
export function renderSystemServices(services) {
    const main = document.querySelector(".content");
    if (!main) return;

    const runningCount = services.filter(s => s.status === "running").length;
    const degradedCount = services.filter(s => s.status === "degraded").length;
    const stoppedCount = services.filter(s => s.status === "stopped").length;

    const order = ["Docker", "Redis", "Celery", "Ollama", "Postgres"];
    const sortedServices = [...services].sort((a, b) => {
        const idxA = order.indexOf(a.name);
        const idxB = order.indexOf(b.name);
        if (idxA === -1 && idxB === -1) return a.name.localeCompare(b.name);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    main.innerHTML = `
        <div class="system-config-page">
            <div class="system-header">
                <h1>System Configuration</h1>
                <p>Monitor system services health and status.</p>
            </div>

            <div class="system-stats-grid">
                <div class="stat-card">
                    <span class="stat-title">RUNNING</span>
                    <h2 class="stat-number">${runningCount}</h2>
                </div>
                <div class="stat-card">
                    <span class="stat-title">DEGRADED</span>
                    <h2 class="stat-number">${degradedCount}</h2>
                </div>
                <div class="stat-card">
                    <span class="stat-title">STOPPED</span>
                    <h2 class="stat-number">${stoppedCount}</h2>
                </div>
            </div>

            <div class="services-grid">
                ${sortedServices.map(service => renderServiceCard(service)).join("")}
            </div>
        </div>
    `;
}

/* Tarjeta de servicio (compacta) - se mantiene igual */
function renderServiceCard(service) {
    const descriptions = {
        Docker: "Container runtime",
        Redis: "In-memory data store / cache",
        Celery: "Distributed task queue",
        Ollama: "Local LLM inference engine",
        Postgres: "Primary relational database"
    };
    const desc = descriptions[service.name] || "Service";

    return `
        <div class="service-card">
            <div class="service-card-header">
                <div>
                    <h3 class="service-card-name">${escapeHtmlContent(service.name)}</h3>
                    <p class="service-card-desc">${desc}</p>
                </div>
                <div class="service-status-badge ${service.status}">${service.status}</div>
            </div>
            <div class="service-card-details">
                <div class="detail-row">
                    <span class="detail-label">Uptime</span>
                    <span class="detail-value">${service.uptime || "—"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Memory</span>
                    <span class="detail-value">${service.memory || "—"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">CPU Usage</span>
                    <span class="detail-value">${service.cpu || "—"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Port</span>
                    <span class="detail-value">${service.port || "—"}</span>
                </div>
            </div>
            <div class="service-card-footer">
                <span>Last checked: Just now</span>
                <span>Last checked: Just now</span>
            </div>
        </div>
    `;
}

function formatLogTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}
