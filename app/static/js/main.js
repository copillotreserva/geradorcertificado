const LAST_SELECTED_ID_KEY = 'lastSelectedTitleId';

function applyLastSelection() {
    const lastSelectedId = localStorage.getItem(LAST_SELECTED_ID_KEY);
    if (lastSelectedId) {
        const lastSelectedRadio = document.getElementById(lastSelectedId);
        if (lastSelectedRadio) {
            lastSelectedRadio.checked = true;
            lastSelectedRadio.dispatchEvent(new Event('change'));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PARA O FORMULÁRIO DE CERTIFICADOS ---
    const certState = {
        items: [],
        form: document.getElementById('form-certificado'),
        addButton: document.getElementById('add-btn-cert'),
        clearButton: document.getElementById('clear-btn-cert'),
        editIndexField: document.getElementById('edit-index-cert'),
        listaUI: document.getElementById('lista-certificados'),
        batchDataInput: document.getElementById('batch_data_cert'),
        nextFieldToFocus: 'numero-cert'
    };

    setupForm(certState, {
        validate: (cert) => {
            if (!cert.barcode || !cert.data || !cert.numero || !cert.instrumento) {
                alert('Por favor, preencha os campos obrigatórios: Barcode, Data, Nº e Instrumento.');
                return false;
            }
            return true;
        },
        display: (cert) => `<span>Cert: ${cert.numero} - TAG: ${cert.tag || 'N/A'}</span>`,
        fieldsToKeep: ['barcode', 'instrumento', 'id_doc', 'tag', 'equipamento', 'modelo', 'fabricante', 'sala', 'bloco']
    });

    // --- LÓGICA PARA O FORMULÁRIO DE COLETA DE DADOS ---
    const coletaState = {
        items: [],
        form: document.getElementById('form-coleta'),
        addButton: document.getElementById('add-btn-coleta'),
        clearButton: document.getElementById('clear-btn-coleta'),
        editIndexField: document.getElementById('edit-index-coleta'),
        listaUI: document.getElementById('lista-coleta'),
        batchDataInput: document.getElementById('batch_data_coleta'),
        nextFieldToFocus: 'data-coleta'
    };

    const titleOptions = document.querySelectorAll('input[name="form_title_option"]');
    const customTitleInput = document.getElementById('custom-title-input');
    const dataColetaInput = document.getElementById('data-coleta');

    titleOptions.forEach(radio => {
        radio.addEventListener('change', () => {
            localStorage.setItem(LAST_SELECTED_ID_KEY, radio.id);
            if (radio.value === 'custom') {
                customTitleInput.disabled = false;
            } else {
                customTitleInput.disabled = true;
                customTitleInput.value = '';
            }
        });

        radio.addEventListener('keydown', (event) => {
            const key = event.key;
            if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'Enter') return;
            event.preventDefault();

            if (key === 'Enter') {
                event.stopPropagation();
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
                if (radio.value === 'custom') {
                    customTitleInput.focus();
                } else {
                    dataColetaInput.focus();
                }
            } else {
                const radios = Array.from(titleOptions);
                const currentIndex = radios.indexOf(event.target);
                let nextIndex;
                if (key === 'ArrowDown') nextIndex = (currentIndex + 1) % radios.length;
                else if (key === 'ArrowUp') nextIndex = (currentIndex - 1 + radios.length) % radios.length;

                const nextRadio = radios[nextIndex];
                nextRadio.focus();
                nextRadio.checked = true;
                nextRadio.dispatchEvent(new Event('change'));
            }
        });
    });

    customTitleInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            dataColetaInput.focus();
        }
    });

    applyLastSelection();

    setupForm(coletaState, {
        validate: (item) => {
            if (!item.barcode || !item.data) {
                alert('Por favor, preencha os campos obrigatórios: Barcode e Data.');
                return false;
            }
            if (!item.titulo) {
                 alert('Por favor, selecione um título ou preencha o campo "Outro".');
                 return false;
            }
            return true;
        },
        display: (item) => `<span>${item.titulo} - TAG: ${item.tag || 'N/A'}</span>`,
        fieldsToKeep: ['barcode', 'id_doc', 'tag', 'sala', 'bloco']
    });

    document.getElementById('data-cert').addEventListener('input', (e) => formatarData(e.target));
    document.getElementById('numero-cert').addEventListener('input', (e) => formatarCertificado(e.target));
    document.getElementById('data-coleta').addEventListener('input', (e) => formatarData(e.target));
});

function setupForm(state, config) {
    state.addButton.addEventListener('click', () => adicionarOuAtualizarItem(state, config));
    state.clearButton.addEventListener('click', () => limparLista(state, config));
    const formIdentifier = state.form.id.replace(/-/g, '_');
    window[`editar_${formIdentifier}`] = (index) => editarItem(index, state, config);
    window[`excluir_${formIdentifier}`] = (index) => excluirItem(index, state, config);
}

function adicionarOuAtualizarItem(state, config) {
    const dados = new FormData(state.form);
    const item = Object.fromEntries(dados.entries());

    if (state.form.id === 'form-coleta') {
        if (item.form_title_option === 'custom') {
            item.titulo = item.custom_title;
        } else {
            item.titulo = item.form_title_option;
        }
        delete item.form_title_option;
        delete item.custom_title;
    }

    if (!config.validate(item) || !validarData(item.data)) {
         if (config.validate(item) && !validarData(item.data)) {
            alert("Formato de data inválido. Por favor, use dd/mm/aaaa.");
            state.form.elements['data'].focus();
        }
        return;
    }

    const editIndex = parseInt(state.editIndexField.value, 10);
    if (editIndex > -1) {
        state.items[editIndex] = item;
    } else {
        state.items.push(item);
    }

    resetarFormulario(state, config);
    atualizarListaVisual(state, config);
}

function limparLista(state, config) {
    if (state.items.length > 0 && confirm('Tem certeza que deseja limpar toda a lista?')) {
        state.items = [];
        atualizarListaVisual(state, config);
        resetarFormulario(state, config);
    }
}

function editarItem(index, state, config) {
    const item = state.items[index];

    if (state.form.id === 'form-coleta') {
        const titleOptions = document.querySelectorAll('input[name="form_title_option"]');
        const customTitleInput = document.getElementById('custom-title-input');
        let isCustom = true;

        titleOptions.forEach(radio => {
            if (radio.value === item.titulo) {
                radio.checked = true;
                customTitleInput.disabled = true;
                customTitleInput.value = '';
                isCustom = false;
            }
        });

        if (isCustom) {
            document.getElementById('title-opt-8').checked = true;
            customTitleInput.disabled = false;
            customTitleInput.value = item.titulo;
        }
    }

    const suffix = state.form.id.split('-')[1];
    for (const key in item) {
        if (state.form.id === 'form-coleta' && key === 'titulo') continue;
        const input = document.getElementById(`${key}-${suffix}`);
        if (input) {
            input.value = item[key];
        }
    }
    state.editIndexField.value = index;
    state.addButton.textContent = '💾 Atualizar Item';
    state.addButton.style.backgroundColor = '#ffc107';
    document.getElementById(state.nextFieldToFocus).focus();
}

function excluirItem(index, state, config) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        state.items.splice(index, 1);
        atualizarListaVisual(state, config);
        if (parseInt(state.editIndexField.value, 10) === index) {
            resetarFormulario(state, config);
        }
    }
}

function atualizarListaVisual(state, config) {
    state.listaUI.innerHTML = '';
    const formIdentifier = state.form.id.replace(/-/g, '_');
    state.items.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${config.display(item)}
            <div class="list-actions">
                <span onclick="window.editar_${formIdentifier}(${index})">✏️</span>
                <span onclick="window.excluir_${formIdentifier}(${index})">🗑️</span>
            </div>
        `;
        state.listaUI.appendChild(li);
    });
    state.batchDataInput.value = JSON.stringify(state.items);
}

function resetarFormulario(state, config) {
    const camposParaManter = {};
    const suffix = state.form.id.split('-')[1];
    config.fieldsToKeep.forEach(field => {
        const input = document.getElementById(`${field}-${suffix}`);
        if(input) {
            camposParaManter[input.id] = input.value;
        }
    });

    state.form.reset();
    for (const campoId in camposParaManter) {
        const input = document.getElementById(campoId);
        if (input) {
            input.value = camposParaManter[campoId];
        }
    }

    if (state.form.id === 'form-coleta') {
        applyLastSelection();
    }

    state.editIndexField.value = -1;
    state.addButton.textContent = '+ Adicionar à Lista';
    state.addButton.style.backgroundColor = 'var(--btn-add)';
    let nextFocusElement = document.getElementById(state.nextFieldToFocus);
    if (nextFocusElement) {
        nextFocusElement.focus();
    }
}