const usuarioInput = document.getElementById('usuario');
const codigoInput = document.getElementById('codigo');
const novaSenhaInput = document.getElementById('novaSenha');

const btnEnviar = document.getElementById('btnEnviar');
const btnVerificar = document.getElementById('btnVerificar');
const btnAlterar = document.getElementById('btnAlterar');

const msg = document.getElementById('msg');

// 🔹 Passo 1: Enviar código
btnEnviar.onclick = async () => {
    const usuario = usuarioInput.value.trim();
    if (!usuario) {
        msg.textContent = 'Informe o usuário ou e-mail';
        msg.style.color = 'red';
        return;
    }

    try {
        const res = await fetch('/recuperar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario })
        });

        const data = await res.json();
        console.log('Resposta do servidor:', res, data);

        if (!res.ok) {
            msg.textContent = data.erro || 'Erro desconhecido';
            msg.style.color = 'red';
            return;
        }

        msg.textContent = 'Código enviado para o e-mail!';
        msg.style.color = 'green';
        msg.textContent = 'Código enviado para o e-mail!';
        msg.style.color = 'green';

        // 🔥 MOSTRAR CAMPO DO CÓDIGO
        codigoInput.style.display = 'block';
        btnVerificar.style.display = 'block';

    } catch (err) {
        msg.textContent = 'Erro ao conectar com o servidor';
        msg.style.color = 'red';
        console.error('Erro fetch /recuperar-senha:', err);
    }
};


// 🔹 Passo 2: Verificar código
btnVerificar.onclick = async () => {
    const usuario = usuarioInput.value.trim();
    const codigo = codigoInput.value.trim();

    if (!codigo) {
        msg.textContent = 'Informe o código';
        msg.style.color = 'red';
        return;
    }

    try {
        const res = await fetch('/verificar-codigo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, codigo })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.erro || 'Código inválido';
            msg.style.color = 'red';
            console.error('Erro do servidor:', data);
            return;
        }

        msg.textContent = 'Código verificado! Informe a nova senha';
        msg.style.color = 'green';

        // Mostrar próximo passo
        novaSenhaInput.style.display = 'block';
        btnAlterar.style.display = 'block';
    } catch (err) {
        msg.textContent = 'Erro ao conectar com o servidor';
        msg.style.color = 'red';
        console.error('Erro fetch /recuperar-senha:', err);
    }

};

// 🔹 Passo 3: Alterar senha
btnAlterar.onclick = async () => {
    const usuario = usuarioInput.value.trim();
    const novaSenha = novaSenhaInput.value.trim();

    if (!novaSenha) {
        msg.textContent = 'Informe a nova senha';
        msg.style.color = 'red';
        return;
    }

    try {
        const res = await fetch('/usuarios/alterar-senha-recuperacao', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, novaSenha })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.erro || 'Erro ao alterar senha';
            msg.style.color = 'red';
            console.error('Erro do servidor:', data);
            return;
        }

        msg.textContent = 'Senha alterada com sucesso!';
        msg.style.color = 'green';

        // Oculta campos para segurança
        codigoInput.style.display = 'none';
        btnVerificar.style.display = 'none';
        novaSenhaInput.style.display = 'none';
        btnAlterar.style.display = 'none';
    } catch (err) {
        msg.textContent = 'Erro ao conectar com o servidor';
        msg.style.color = 'red';
        console.error('Erro de conexão:', err);
    }
};
