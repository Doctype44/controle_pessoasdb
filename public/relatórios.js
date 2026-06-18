const filtro = document.getElementById('filtroVencidos');
const lista = document.getElementById('listaVencidos');

async function carregarVencidos() {
    let url = '/relatorios/vencidos';

    if (filtro.value) {
        url += `?periodo=${filtro.value}`;
    }

    const res = await fetch(url);
    const dados = await res.json();

    lista.innerHTML = '';

    if (dados.length === 0) {
        lista.innerHTML = `
            <tr>
                <td colspan="4">Nenhum registro encontrado</td>
            </tr>
        `;
        return;
    }

    dados.forEach(pessoa => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${pessoa.nome}</td>
            <td>${pessoa.cpf}</td>
            <td>${new Date(pessoa.data_fim).toLocaleDateString()}</td>
            <td style="color:red;font-weight:bold;">❌ Vencido</td>
        `;

        lista.appendChild(tr);
    });
}

filtro.addEventListener('change', carregarVencidos);
carregarVencidos();
