document.addEventListener('DOMContentLoaded', () => {
    let certificados = [];
    const form = document.getElementById('form-certificado');
    const addButton = document.getElementById('add-btn');
    const clearButton = document.getElementById('clear-btn');
    const editIndexField = document.getElementById('edit-index');
    const listaUI = document.getElementById('lista-certificados');
    const batchDataInput = document.getElementById('batch_data');

    // Adiciona os listeners de formatação
    document.getElementById('data').addEventListener('input', (e) => formatarData(e.target));
    document.getElementById('numero').addEventListener('input', (e) => formatarCertificado(e.target));
    
    addButton.addEventListener('click', adicionarOuAtualizarCertificado);
    clearButton.addEventListener('click', limparLista);

    // Expõe funções para o escopo global para que o onclick no HTML funcione
    window.editarCertificado = editarCertificado;
    window.excluirCertificado = excluirCertificado;
    window.handleEnter = handleEnter;

    function handleEnter(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"])'));
            const currentIndex = inputs.indexOf(document.activeElement);
            if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            } else if (currentIndex === inputs.length - 1) {
                addButton.click();
            }
        }
    }

    function formatarData(input) { let v = input.value.replace(/\D/g, '').slice(0, 8); if (v.length >= 5) { input.value = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`; } else if (v.length >= 3) { input.value = `${v.slice(0, 2)}/${v.slice(2)}`; } else { input.value = v; } }
    function formatarCertificado(input) { let v = input.value.replace(/\D/g, '').slice(0, 8); if (v.length > 6) { input.value = `${v.slice(0, 6)}/${v.slice(6)}`; } else { input.value = v; } }

    function validarData(dataStr) {
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(dataStr)) return false;
        const [dia, mes, ano] = dataStr.split('/').map(Number);
        const data = new Date(ano, mes - 1, dia);
        return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
    }

    function adicionarOuAtualizarCertificado() {
        const dados = new FormData(form);
        const cert = Object.fromEntries(dados.entries());

        if (!cert.barcode || !cert.data || !cert.numero || !cert.equipamento) {
            alert('Por favor, preencha os campos obrigatórios: Barcode, Data, Nº e Equipamento.');
            return;
        }
        if (!validarData(cert.data)) {
            alert("Formato de data inválido. Por favor, use dd/mm/aaaa.");
            document.getElementById('data').focus();
            return;
        }

        const editIndex = parseInt(editIndexField.value, 10);
        if (editIndex > -1) {
            certificados[editIndex] = cert;
        } else {
            certificados.push(cert);
        }
        
        resetarFormulario();
        atualizarListaVisual();
    }

    function limparLista() {
        if (certificados.length > 0 && confirm('Tem certeza que deseja limpar toda a lista?')) {
            certificados = [];
            atualizarListaVisual();
            resetarFormulario();
        }
    }

    function editarCertificado(index) {
        const cert = certificados[index];
        for (const key in cert) {
            if (form.elements[key]) {
                form.elements[key].value = cert[key];
            }
        }
        editIndexField.value = index;
        addButton.textContent = '💾 Atualizar Item';
        addButton.style.backgroundColor = '#ffc107';
        document.getElementById('numero').focus();
    }

    function excluirCertificado(index) {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            certificados.splice(index, 1);
            atualizarListaVisual();
            if (parseInt(editIndexField.value, 10) === index) {
                resetarFormulario();
            }
        }
    }

    function atualizarListaVisual() {
        listaUI.innerHTML = '';
        certificados.forEach((cert, index) => {
            const item = document.createElement('li');
            item.innerHTML = `
                <span>Cert: ${cert.numero} - TAG: ${cert.tag || 'N/A'}</span>
                <div class="list-actions">
                    <span onclick="editarCertificado(${index})">✏️</span>
                    <span onclick="excluirCertificado(${index})">🗑️</span>
                </div>
            `;
            listaUI.appendChild(item);
        });
        batchDataInput.value = JSON.stringify(certificados);
    }

    function resetarFormulario() {
        // Campos que serão "lembrados"
        const camposParaManter = {
            barcode: form.elements['barcode'].value,
            equipamento: form.elements['equipamento'].value,
            id_doc: form.elements['id_doc'].value,
            tag: form.elements['tag'].value,
            modelo: form.elements['modelo'].value,
            fabricante: form.elements['fabricante'].value,
            sala: form.elements['sala'].value,
            bloco: form.elements['bloco'].value,
        };
        
        form.reset(); // Limpa tudo

        // Restaura os valores que queremos manter
        for (const campo in camposParaManter) {
            if (form.elements[campo]) {
                form.elements[campo].value = camposParaManter[campo];
            }
        }

        editIndexField.value = -1;
        addButton.textContent = '+ Adicionar à Lista';
        addButton.style.backgroundColor = 'var(--btn-add)';
        // MUDANÇA AQUI: O cursor agora vai para o campo "Nº do Certificado"
        document.getElementById('numero').focus();
    }
});
