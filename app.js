document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar la nieve y el efecto paraguas
    initSnowflakes();

    // 2. Aquí prepararemos la lógica del CRUD
    initCRUD();

    // 3. Cargar los usuarios guardados previamente en LocalStorage
    loadUsers();
});

function initSnowflakes() {
    // Crear el contenedor de la nieve
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    document.body.prepend(snowContainer);

    const snowflakes = [];
    const numFlakes = 100; // Cantidad de copos de nieve

    // Generar copos de nieve
    for (let i = 0; i < numFlakes; i++) {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');

        // Propiedades aleatorias para hacerlo natural
        const size = Math.random() * 4 + 2; // de 2px a 6px
        const left = Math.random() * 100; // 0 a 100vw
        const duration = Math.random() * 10 + 8; // caída entre 8s y 18s
        const delay = Math.random() * 10; // retraso inicial

        flake.style.width = `${size}px`;
        flake.style.height = `${size}px`;
        flake.style.left = `${left}vw`;
        // Aplicar la animación de CSS
        flake.style.animation = `fall ${duration}s linear ${delay}s infinite`;

        snowContainer.appendChild(flake);
        snowflakes.push(flake);
    }

    // Efecto "Paraguas" con el Cursor
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        snowflakes.forEach(flake => {
            const rect = flake.getBoundingClientRect();
            // Calcular el centro del copo
            const flakeX = rect.left + rect.width / 2;
            const flakeY = rect.top + rect.height / 2;

            // Calcular distancia entre cursor y copo
            const distX = flakeX - mouseX;
            const distY = flakeY - mouseY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            // Radio de repelencia (el tamaño del "paraguas")
            const maxDistance = 150;

            if (distance < maxDistance) {
                // Si el cursor está cerca, calcular fuerza para alejarlo
                const force = (maxDistance - distance) / maxDistance;
                // Multiplicamos por la fuerza máxima de desplazamiento
                const pushX = (distX / distance) * force * 60;
                const pushY = (distY / distance) * force * 60;

                // Usamos transform de CSS (el cual tiene transición suave)
                flake.style.transform = `translate(${pushX}px, ${pushY}px)`;
            } else {
                // Si el cursor se aleja, volver a su posición original
                flake.style.transform = 'translate(0, 0)';
            }
        });
    });
}

let users = [];
let editingUserId = null;

// Funciones de LocalStorage
function saveUsers() {
    localStorage.setItem('crud_users_data', JSON.stringify(users));
}

function loadUsers() {
    const saved = localStorage.getItem('crud_users_data');
    if (saved) {
        users = JSON.parse(saved);
        renderUsers();
    }
}

function initCRUD() {
    const form = document.getElementById('user-form');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Evita recarga de la página

        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const musicTypeInput = document.getElementById('musicType');

        const fullNameError = document.getElementById('fullNameError');
        const emailError = document.getElementById('emailError');

        // Limpiar errores visuales previos
        fullNameInput.classList.remove('input-error');
        emailInput.classList.remove('input-error');
        musicTypeInput.classList.remove('input-error');
        if (fullNameError) fullNameError.textContent = '';
        if (emailError) emailError.textContent = '';

        // Capturar valores y limpiar espacios
        const fullname = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const musicType = musicTypeInput.value.trim();

        let hasError = false;

        // Validación estricta de nombre completo (solo letras y espacios, mín 3 caracteres)
        const nameRegex = /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]{3,}$/;
        if (!nameRegex.test(fullname)) {
            if (fullNameError) fullNameError.textContent = 'Solo letras y espacios (mínimo 3 caracteres).';
            fullNameInput.classList.add('input-error');
            hasError = true;
        }

        // Validación estricta de correo
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            if (emailError) emailError.textContent = 'Ingrese un correo electrónico válido.';
            emailInput.classList.add('input-error');
            hasError = true;
        }

        if (hasError) return;

        if (editingUserId) {
            // Actualizar usuario existente
            const userIndex = users.findIndex(u => u.id === editingUserId);
            if (userIndex !== -1) {
                users[userIndex].fullname = fullname;
                users[userIndex].email = email;
                users[userIndex].musicType = musicType;
                // La fecha (date) original se mantiene
            }
            editingUserId = null;
            submitBtn.textContent = 'Guardar Registro';
        } else {
            // Crear objeto de nuevo usuario
            const newUser = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString(),
                fullname,
                email,
                musicType
            };
            users.push(newUser);
        }

        saveUsers(); // Persistencia
        form.reset();
        renderUsers();
    });
}

function renderUsers() {
    const tbody = document.getElementById('users-tbody');

    // Limpieza estricta usando DOM nativo, evitando innerHTML
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    users.forEach(user => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = user.fullname;

        const tdEmail = document.createElement('td');
        tdEmail.textContent = user.email;

        const tdMusic = document.createElement('td');
        tdMusic.textContent = user.musicType;

        const tdActions = document.createElement('td');

        // Contenedor flexible para los botones
        const actionsContainer = document.createElement('div');
        actionsContainer.style.display = 'flex';
        actionsContainer.style.gap = '0.5rem';

        // Botón Editar
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.style.backgroundColor = '#f59e0b'; // Naranja
        editBtn.style.padding = '0.5rem 1rem';
        editBtn.style.marginTop = '0';
        editBtn.addEventListener('click', () => {
            // Cargar datos al formulario
            document.getElementById('fullName').value = user.fullname;
            document.getElementById('email').value = user.email;
            document.getElementById('musicType').value = user.musicType;

            editingUserId = user.id;
            document.getElementById('submit-btn').textContent = 'Actualizar';

            // Animación para scrollear hacia arriba (suavemente)
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        });

        // Botón Eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.style.backgroundColor = '#ef4444'; // Rojo
        deleteBtn.style.padding = '0.5rem 1rem';
        deleteBtn.style.marginTop = '0';
        deleteBtn.addEventListener('click', () => {
            users = users.filter(u => u.id !== user.id);
            saveUsers();
            renderUsers();
        });

        actionsContainer.appendChild(editBtn);
        actionsContainer.appendChild(deleteBtn);
        tdActions.appendChild(actionsContainer);

        tr.appendChild(tdName);
        tr.appendChild(tdEmail);
        tr.appendChild(tdMusic);
        tr.appendChild(tdActions);

        tbody.appendChild(tr);
    });
}
