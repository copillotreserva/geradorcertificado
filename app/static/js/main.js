// === LÓGICA DAS ABAS ===
function openTab(evt, tabName) {
    // Esconde todos os conteúdos de aba
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }

    // Desativa todos os links de aba
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Mostra a aba atual e ativa o botão
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// === LÓGICA GLOBAL COMPARTILHADA ===
document.addEventListener('DOMContentLoaded', () => {
    // Ativa a primeira aba por padrão
    document.querySelector('.tab-link.active').click();

    // --- Funções de Formatação ---
    const formatarData = (input) => {
        let v = input.value.replace(/\D/g, '').slice(0, 8);
        if (v.length >= 5) input.value = `${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4)}`;
        else if (v.length >= 3) input.value = `${v.slice(0,2)}/${v.slice(2)}`;
        else input.value = v;
    };
    const formatarCertificado = (input) => {
        let v = input.value.replace(/\D/g, '').slice(0, 8);
        if (v.length > 6) input.value = `${v.slice(0,6)}/${v.slice(6)}`;
        else input.value = v;
    };
    const validarData = (dataStr) => {
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(dataStr)) return false;
        const [dia, mes, ano] = dataStr.split('/').map(Number);
        const data = new Date(ano, mes - 1, dia);
        return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
    };

    // --- Lógica de Navegação com Enter ---
    window.handleEnter = (event, formId, addButtonId) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const form = document.getElementById(formId);
            const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"]), select'));
            const currentIndex = inputs.indexOf(document.activeElement);
            if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            } else if (currentIndex === inputs.length - 1) {
                document.getElementById(addButtonId).click();
            }
        }
    };

    // === LÓGICA PARA CERTIFICADOS DE CALIBRAÇÃO ===
    (() => {
        let certificados = [];
        const form = document.getElementById('form-certificado');
        const addButton = document.getElementById('add-btn-calibracao');
        const clearButton = document.getElementById('clear-btn-calibracao');
        const editIndexField = document.getElementById('edit-index-calibracao');
        const listaUI = document.getElementById('lista-calibracao');
        const batchDataInput = document.getElementById('batch_data_calibracao');

        document.getElementById('data_calibracao').addEventListener('input', (e) => formatarData(e.target));
        document.getElementById('numero').addEventListener('input', (e) => formatarCertificado(e.target));
        addButton.addEventListener('click', adicionarOuAtualizar);
        clearButton.addEventListener('click', limpar);

        window.editarCertificado = editar;
        window.excluirCertificado = excluir;

        function adicionarOuAtualizar() {
            const dados = new FormData(form);
            const cert = Object.fromEntries(dados.entries());
            if (!cert.barcode || !cert.data || !cert.numero || !cert.instrumento) {
                alert('Preencha os campos obrigatórios: Barcode, Data, Nº e Instrumento.');
                return;
            }
            if (!validarData(cert.data)) {
                alert("Data inválida. Use dd/mm/aaaa.");
                return;
            }
            const editIndex = parseInt(editIndexField.value, 10);
            if (editIndex > -1) certificados[editIndex] = cert;
            else certificados.push(cert);

            resetar();
            atualizarLista();
        }

        function limpar() {
            if (certificados.length > 0 && confirm('Limpar a lista de certificados?')) {
                certificados = [];
                atualizarLista();
                resetar();
            }
        }

        function editar(index) {
            const cert = certificados[index];
            for (const key in cert) if (form.elements[key]) form.elements[key].value = cert[key];
            editIndexField.value = index;
            addButton.textContent = '💾 Atualizar Item';
            document.getElementById('numero').focus();
        }

        function excluir(index) {
            if (confirm('Excluir este certificado?')) {
                certificados.splice(index, 1);
                atualizarLista();
                if (parseInt(editIndexField.value, 10) === index) resetar();
            }
        }

        function atualizarLista() {
            listaUI.innerHTML = '';
            certificados.forEach((cert, index) => {
                const item = document.createElement('li');
                item.innerHTML = `<span>Cert: ${cert.numero} - TAG: ${cert.tag||'N/A'}</span><div class="list-actions"><span onclick="editarCertificado(${index})">✏️</span><span onclick="excluirCertificado(${index})">🗑️</span></div>`;
                listaUI.appendChild(item);
            });
            batchDataInput.value = JSON.stringify(certificados);
        }

        function resetar() {
            const camposParaManter = ['barcode', 'instrumento', 'id_doc', 'tag', 'equipamento', 'modelo', 'fabricante', 'sala', 'bloco'];
            const valores = {};
            camposParaManter.forEach(id => {
                const name = id.replace(/_calibracao$/, ''); // Remove sufixo para bater com o nome do campo
                valores[name] = form.elements[id] ? form.elements[id].value : (form.elements[name] ? form.elements[name].value : '');
            });

            form.reset();
            for (const campo in valores) if (form.elements[campo]) form.elements[campo].value = valores[campo];

            editIndexField.value = -1;
            addButton.textContent = '+ Adicionar à Lista';
            document.getElementById('numero').focus();
        }
    })();

    // === LÓGICA PARA ORDENS DE SERVIÇO (OS) ===
    (() => {
        let ordensServico = [];
        const form = document.getElementById('form-os');
        const addButton = document.getElementById('add-btn-os');
        const clearButton = document.getElementById('clear-btn-os');
        const editIndexField = document.getElementById('edit-index-os');
        const listaUI = document.getElementById('lista-os');
        const batchDataInput = document.getElementById('batch_data_os');

        document.getElementById('os_data').addEventListener('input', (e) => formatarData(e.target));
        addButton.addEventListener('click', adicionarOuAtualizar);
        clearButton.addEventListener('click', limpar);

        window.editarOS = editar;
        window.excluirOS = excluir;

        function adicionarOuAtualizar() {
            const dados = new FormData(form);
            const os = Object.fromEntries(dados.entries());
            const obrigatorios = ['barcode', 'data', 'tipo_os', 'equipamento', 'tag', 'bloco', 'fabricante', 'modelo'];
            for (const campo of obrigatorios) {
                if (!os[campo]) {
                    alert(`O campo '${document.querySelector(`label[for='os_${campo}']`).textContent}' é obrigatório.`);
                    return;
                }
            }
            if (!validarData(os.data)) {
                alert("Data inválida. Use dd/mm/aaaa.");
                return;
            }

            const editIndex = parseInt(editIndexField.value, 10);
            if (editIndex > -1) ordensServico[editIndex] = os;
            else ordensServico.push(os);

            resetar();
            atualizarLista();
        }

        function limpar() {
            if (ordensServico.length > 0 && confirm('Limpar a lista de Ordens de Serviço?')) {
                ordensServico = [];
                atualizarLista();
                resetar();
            }
        }

        function editar(index) {
            const os = ordensServico[index];
            for (const key in os) if (form.elements[key]) form.elements[key].value = os[key];
            editIndexField.value = index;
            addButton.textContent = '💾 Atualizar Item';
            document.getElementById('os_tipo').focus();
        }

        function excluir(index) {
            if (confirm('Excluir esta Ordem de Serviço?')) {
                ordensServico.splice(index, 1);
                atualizarLista();
                if (parseInt(editIndexField.value, 10) === index) resetar();
            }
        }

        function atualizarLista() {
            listaUI.innerHTML = '';
            ordensServico.forEach((os, index) => {
                const item = document.createElement('li');
                item.innerHTML = `<span>OS: ${os.equipamento} - TAG: ${os.tag}</span><div class="list-actions"><span onclick="editarOS(${index})">✏️</span><span onclick="excluirOS(${index})">🗑️</span></div>`;
                listaUI.appendChild(item);
            });
            batchDataInput.value = JSON.stringify(ordensServico);
        }

        function resetar() {
            const camposParaManter = ['barcode', 'data', 'equipamento', 'tag', 'bloco', 'fabricante', 'modelo'];
            const valores = {};
            camposParaManter.forEach(id => valores[id] = form.elements[id].value);

            form.reset();
            for (const campo in valores) if (form.elements[campo]) form.elements[campo].value = valores[campo];

            editIndexField.value = -1;
            addButton.textContent = '+ Adicionar à Lista';
            document.getElementById('os_tipo').focus();
        }
    })();
});