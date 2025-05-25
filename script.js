// Configuração da API
const API_BASE_URL = 'http://localhost:8080/api';

// Variáveis globais
let editandoVeiculo = false;
let veiculoParaExcluir = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carregar veículos na inicialização
    listarTodosVeiculos();
    
    // Event listener para o formulário
    document.getElementById('vehicleForm').addEventListener('submit', function(e) {
        e.preventDefault();
        if (editandoVeiculo) {
            atualizarVeiculo();
        } else {
            criarVeiculo();
        }
    });

    // Event listener para busca com Enter
    document.getElementById('searchId').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarVeiculo();
        }
    });

    // Event listeners para fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModal();
        }
    });
});

// Função para mostrar seções
function mostrarSecao(secao) {
    // Esconder todas as seções
    document.querySelectorAll('.secao').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Mostrar seção selecionada
    document.getElementById(`secao-${secao}`).classList.add('active');
    document.getElementById(`nav-${secao}`).classList.add('active');
    
    // Limpar busca quando sair da seção
    if (secao !== 'buscar') {
        document.getElementById('search-result').innerHTML = '';
        document.getElementById('searchId').value = '';
    }
    
    // Limpar filtros quando sair da seção
    if (secao !== 'filtros') {
        document.getElementById('filter-result').innerHTML = '';
    }
    
    // Cancelar edição quando sair da seção criar
    if (secao !== 'criar' && editandoVeiculo) {
        cancelarEdicao();
    }
}

// Função para mostrar loading
function mostrarLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = texto;
    messageDiv.className = `message ${tipo}`;
    messageDiv.classList.remove('hidden');
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
    
    // Scroll para o topo para ver a mensagem
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toggle campos específicos baseado no tipo (formulário principal)
function toggleCamposEspecificos() {
    const tipo = document.getElementById('tipo').value;
    const camposCarro = document.getElementById('campos-carro');
    const camposMoto = document.getElementById('campos-moto');
    
    if (tipo === 'CARRO') {
        camposCarro.classList.remove('hidden');
        camposMoto.classList.add('hidden');
        // Tornar campos obrigatórios
        document.getElementById('quantidadePortas').required = true;
        document.getElementById('tipoCombustivel').required = true;
        document.getElementById('cilindrada').required = false;
    } else if (tipo === 'MOTO') {
        camposMoto.classList.remove('hidden');
        camposCarro.classList.add('hidden');
        // Tornar campos obrigatórios
        document.getElementById('cilindrada').required = true;
        document.getElementById('quantidadePortas').required = false;
        document.getElementById('tipoCombustivel').required = false;
    } else {
        camposCarro.classList.add('hidden');
        camposMoto.classList.add('hidden');
        // Remover obrigatoriedade
        document.getElementById('quantidadePortas').required = false;
        document.getElementById('tipoCombustivel').required = false;
        document.getElementById('cilindrada').required = false;
    }
}

// Toggle campos específicos baseado no tipo (filtros)
function toggleCamposFiltroEspecificos() {
    const tipo = document.getElementById('filtro-tipo').value;
    const camposCarroFiltro = document.getElementById('filtro-campos-carro');
    const camposMotoFiltro = document.getElementById('filtro-campos-moto');
    
    if (tipo === 'CARRO') {
        camposCarroFiltro.classList.remove('hidden');
        camposMotoFiltro.classList.add('hidden');
    } else if (tipo === 'MOTO') {
        camposMotoFiltro.classList.remove('hidden');
        camposCarroFiltro.classList.add('hidden');
    } else {
        camposCarroFiltro.classList.add('hidden');
        camposMotoFiltro.classList.add('hidden');
    }
}

// Função para validar formulário
function validarFormulario() {
    const tipo = document.getElementById('tipo').value;
    
    if (!tipo) {
        mostrarMensagem('Por favor, selecione o tipo do veículo.', 'error');
        return false;
    }
    
    if (tipo === 'CARRO') {
        const quantidadePortas = document.getElementById('quantidadePortas').value;
        const tipoCombustivel = document.getElementById('tipoCombustivel').value;
        
        if (!quantidadePortas || !tipoCombustivel) {
            mostrarMensagem('Por favor, preencha todos os campos específicos do carro.', 'error');
            return false;
        }
    }
    
    if (tipo === 'MOTO') {
        const cilindrada = document.getElementById('cilindrada').value;
        
        if (!cilindrada) {
            mostrarMensagem('Por favor, preencha a cilindrada da moto.', 'error');
            return false;
        }
    }
    
    // Validar ano
    const ano = parseInt(document.getElementById('ano').value);
    const anoAtual = new Date().getFullYear();
    if (ano < 1900 || ano > anoAtual + 1) {
        mostrarMensagem(`Ano deve estar entre 1900 e ${anoAtual + 1}.`, 'error');
        return false;
    }
    
    // Validar preço
    const preco = parseFloat(document.getElementById('preco').value);
    if (preco <= 0) {
        mostrarMensagem('Preço deve ser maior que zero.', 'error');
        return false;
    }
    
    return true;
}

// Função para coletar dados do formulário
function coletarDadosFormulario() {
    const dados = {
        modelo: document.getElementById('modelo').value.trim(),
        fabricante: document.getElementById('fabricante').value.trim(),
        ano: parseInt(document.getElementById('ano').value),
        preco: parseFloat(document.getElementById('preco').value),
        cor: document.getElementById('cor').value.trim(),
        tipo: document.getElementById('tipo').value
    };
    
    if (dados.tipo === 'CARRO') {
        dados.quantidadePortas = parseInt(document.getElementById('quantidadePortas').value);
        dados.tipoCombustivel = document.getElementById('tipoCombustivel').value;
    } else if (dados.tipo === 'MOTO') {
        dados.cilindrada = parseInt(document.getElementById('cilindrada').value);
    }
    
    return dados;
}

// Função para criar veículo
async function criarVeiculo() {
    if (!validarFormulario()) return;
    
    try {
        mostrarLoading(true);
        const dados = coletarDadosFormulario();
        
        const response = await fetch(`${API_BASE_URL}/veiculos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        if (response.ok) {
            const veiculo = await response.json();
            mostrarMensagem(`Veículo "${dados.modelo}" criado com sucesso! ID: ${veiculo.id}`, 'success');
            limparFormulario();
            listarTodosVeiculos();
            // Voltar para a página inicial
            setTimeout(() => mostrarSecao('home'), 1500);
        } else {
            const erro = await response.text();
            mostrarMensagem(`Erro ao criar veículo: ${erro}`, 'error');
        }
    } catch (error) {
        mostrarMensagem(`Erro de conexão: ${error.message}`, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Função para buscar veículo por ID
async function buscarVeiculo() {
    const id = document.getElementById('searchId').value;
    
    if (!id) {
        mostrarMensagem('Por favor, digite um ID para buscar.', 'error');
        return;
    }
    
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/veiculos/${id}`);
        
        if (response.ok) {
            const veiculo = await response.json();
            exibirResultadoBusca([veiculo]);
            mostrarMensagem('Veículo encontrado!', 'success');
        } else if (response.status === 404) {
            mostrarMensagem('Veículo não encontrado.', 'error');
            exibirResultadoBusca([]);
        } else {
            mostrarMensagem('Erro ao buscar veículo.', 'error');
            exibirResultadoBusca([]);
        }
    } catch (error) {
        mostrarMensagem(`Erro de conexão: ${error.message}`, 'error');
        exibirResultadoBusca([]);
    } finally {
        mostrarLoading(false);
    }
}

// Função para listar todos os veículos
async function listarTodosVeiculos() {
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/veiculos`);
        
        if (response.ok) {
            const veiculos = await response.json();
            exibirVeiculos(veiculos);
            
            if (veiculos.length === 0) {
                mostrarMensagem('Nenhum veículo cadastrado ainda.', 'error');
            }
        } else {
            mostrarMensagem('Erro ao carregar veículos.', 'error');
            exibirVeiculos([]);
        }
    } catch (error) {
        mostrarMensagem(`Erro de conexão: ${error.message}`, 'error');
        exibirVeiculos([]);
    } finally {
        mostrarLoading(false);
    }
}

// Função para aplicar filtros
async function aplicarFiltros() {
    try {
        mostrarLoading(true);
        
        // Coletar dados dos filtros
        const filtros = coletarDadosFiltros();
        
        // Construir query string
        const queryParams = new URLSearchParams();
        
        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
                queryParams.append(key, filtros[key]);
            }
        });
        
        const queryString = queryParams.toString();
        const url = `${API_BASE_URL}/veiculos/filtro${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
            const veiculos = await response.json();
            exibirResultadoFiltros(veiculos, filtros);
            
            if (veiculos.length === 0) {
                mostrarMensagem('Nenhum veículo encontrado com os filtros aplicados.', 'error');
            } else {
                mostrarMensagem(`${veiculos.length} veículo(s) encontrado(s) com os filtros aplicados.`, 'success');
            }
        } else {
            mostrarMensagem('Erro ao aplicar filtros.', 'error');
            exibirResultadoFiltros([]);
        }
    } catch (error) {
        mostrarMensagem(`Erro de conexão: ${error.message}`, 'error');
        exibirResultadoFiltros([]);
    } finally {
        mostrarLoading(false);
    }
}

// Função para coletar dados dos filtros
function coletarDadosFiltros() {
    const filtros = {};
    
    const tipo = document.getElementById('filtro-tipo').value;
    const fabricante = document.getElementById('filtro-fabricante').value.trim();
    const modelo = document.getElementById('filtro-modelo').value.trim();
    const cor = document.getElementById('filtro-cor').value.trim();
    const anoMin = document.getElementById('filtro-ano-min').value;
    const anoMax = document.getElementById('filtro-ano-max').value;
    const precoMin = document.getElementById('filtro-preco-min').value;
    const precoMax = document.getElementById('filtro-preco-max').value;
    
    if (tipo) filtros.tipo = tipo;
    if (fabricante) filtros.fabricante = fabricante;
    if (modelo) filtros.modelo = modelo;
    if (cor) filtros.cor = cor;
    if (anoMin) filtros.anoMin = parseInt(anoMin);
    if (anoMax) filtros.anoMax = parseInt(anoMax);
    if (precoMin) filtros.precoMin = parseFloat(precoMin);
    if (precoMax) filtros.precoMax = parseFloat(precoMax);
    
    // Campos específicos para carros
    if (tipo === 'CARRO') {
        const quantidadePortas = document.getElementById('filtro-quantidade-portas').value;
        const tipoCombustivel = document.getElementById('filtro-tipo-combustivel').value;
        
        if (quantidadePortas) filtros.quantidadePortas = parseInt(quantidadePortas);
        if (tipoCombustivel) filtros.tipoCombustivel = tipoCombustivel;
    }
    
    // Campos específicos para motos
    if (tipo === 'MOTO') {
        const cilindradaMin = document.getElementById('filtro-cilindrada-min').value;
        const cilindradaMax = document.getElementById('filtro-cilindrada-max').value;
        
        if (cilindradaMin) filtros.cilindradaMin = parseInt(cilindradaMin);
        if (cilindradaMax) filtros.cilindradaMax = parseInt(cilindradaMax);
    }
    
    return filtros;
}

// Função para limpar filtros
function limparFiltros() {
    document.getElementById('filtro-tipo').value = '';
    document.getElementById('filtro-fabricante').value = '';
    document.getElementById('filtro-modelo').value = '';
    document.getElementById('filtro-cor').value = '';
    document.getElementById('filtro-ano-min').value = '';
    document.getElementById('filtro-ano-max').value = '';
    document.getElementById('filtro-preco-min').value = '';
    document.getElementById('filtro-preco-max').value = '';
    
    // Limpar campos específicos
    document.getElementById('filtro-quantidade-portas').value = '';
    document.getElementById('filtro-tipo-combustivel').value = '';
    document.getElementById('filtro-cilindrada-min').value = '';
    document.getElementById('filtro-cilindrada-max').value = '';
    
    // Esconder campos específicos
    document.getElementById('filtro-campos-carro').classList.add('hidden');
    document.getElementById('filtro-campos-moto').classList.add('hidden');
    
    document.getElementById('filter-result').innerHTML = '';
    mostrarMensagem('Filtros limpos!', 'success');
}

// Função para exibir resultado dos filtros
function exibirResultadoFiltros(veiculos, filtros = {}) {
    const container = document.getElementById('filter-result');
    
    // Criar resumo dos filtros aplicados
    const filtrosAplicados = Object.keys(filtros).filter(key => 
        filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== ''
    );
    
    let resumoHTML = '';
    if (filtrosAplicados.length > 0) {
        resumoHTML = `
            <div class="filter-summary">
                <h4>🔍 Filtros Aplicados:</h4>
                ${filtrosAplicados.map(key => {
                    let label = '';
                    let valor = filtros[key];
                    
                    switch(key) {
                        case 'tipo': label = 'Tipo'; break;
                        case 'fabricante': label = 'Fabricante'; break;
                        case 'modelo': label = 'Modelo'; break;
                        case 'cor': label = 'Cor'; break;
                        case 'anoMin': label = 'Ano Mínimo'; break;
                        case 'anoMax': label = 'Ano Máximo'; break;
                        case 'precoMin': label = 'Preço Mínimo'; valor = `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; break;
                        case 'precoMax': label = 'Preço Máximo'; valor = `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; break;
                        case 'quantidadePortas': label = 'Quantidade de Portas'; break;
                        case 'tipoCombustivel': label = 'Combustível'; valor = formatarCombustivel(valor); break;
                        case 'cilindradaMin': label = 'Cilindrada Mínima'; valor = `${valor}cc`; break;
                        case 'cilindradaMax': label = 'Cilindrada Máxima'; valor = `${valor}cc`; break;
                    }
                    
                    return `<p><strong>${label}:</strong> ${valor}</p>`;
                }).join('')}
            </div>
        `;
    }
    
    if (veiculos.length === 0) {
        container.innerHTML = resumoHTML + `
            <div class="empty-state">
                <h3>🔍 Nenhum veículo encontrado</h3>
                <p>Tente ajustar os filtros ou limpar para ver todos os veículos.</p>
                <button onclick="limparFiltros()" class="btn btn-outline">
                    🧹 Limpar Filtros
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = resumoHTML + `
        <div class="filter-count">
            📊 ${veiculos.length} veículo(s) encontrado(s)
        </div>
        <div class="vehicles-grid">
            ${veiculos.map(veiculo => criarCardVeiculo(veiculo)).join('')}
        </div>
    `;
}

// Função para exibir resultado da busca
function exibirResultadoBusca(veiculos) {
    const container = document.getElementById('search-result');
    
    if (veiculos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>🔍 Nenhum veículo encontrado</h3>
                <p>Verifique se o ID está correto e tente novamente.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="vehicles-grid">
            ${veiculos.map(veiculo => criarCardVeiculo(veiculo)).join('')}
        </div>
    `;
}

// Função para exibir veículos na tela
function exibirVeiculos(veiculos) {
    const container = document.getElementById('vehicles-list');
    
    if (veiculos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>🚗 Nenhum veículo cadastrado</h3>
                <p>Comece adicionando seu primeiro veículo!</p>
                <button onclick="mostrarSecao('criar')" class="btn btn-primary">
                    ➕ Adicionar Primeiro Veículo
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="vehicles-grid">
            ${veiculos.map(veiculo => criarCardVeiculo(veiculo)).join('')}
        </div>
    `;
}

// Função para criar card de veículo
function criarCardVeiculo(veiculo) {
    const tipoIcon = veiculo.tipo === 'CARRO' ? '🚗' : '🏍️';
    const tipoClass = veiculo.tipo.toLowerCase();
    
    return `
        <div class="vehicle-card">
            <div class="vehicle-header">
                <span class="vehicle-type ${tipoClass}">${tipoIcon} ${veiculo.tipo}</span>
                <span class="vehicle-id">#${veiculo.id}</span>
            </div>
            
            <div class="vehicle-info">
                <h3>${veiculo.modelo}</h3>
                
                <div class="vehicle-details">
                    <div class="detail-item">
                        <span class="detail-label">Fabricante</span>
                        <span class="detail-value">${veiculo.fabricante}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ano</span>
                        <span class="detail-value">${veiculo.ano}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cor</span>
                        <span class="detail-value">${veiculo.cor}</span>
                    </div>
                    ${veiculo.tipo === 'CARRO' ? `
                        <div class="detail-item">
                            <span class="detail-label">Portas</span>
                            <span class="detail-value">${veiculo.quantidadePortas}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Combustível</span>
                            <span class="detail-value">${formatarCombustivel(veiculo.tipoCombustivel)}</span>
                        </div>
                    ` : ''}
                    ${veiculo.tipo === 'MOTO' ? `
                        <div class="detail-item">
                            <span class="detail-label">Cilindrada</span>
                            <span class="detail-value">${veiculo.cilindrada}cc</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="vehicle-price">
                    R$ ${veiculo.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                
                <div class="vehicle-actions">
                    <button class="btn-edit" onclick="editarVeiculo(${veiculo.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn-delete" onclick="confirmarExclusaoVeiculo(${veiculo.id})">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Função para formatar tipo de combustível
function formatarCombustivel(tipo) {
    const tipos = {
        'gasolina': '⛽ Gasolina',
        'etanol': '🌱 Etanol',
        'flex': '🔄 Flex',
        'diesel': '🛢️ Diesel',
    };
    return tipos[tipo] || tipo;
}

// Função para editar veículo
async function editarVeiculo(id) {
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/veiculos/${id}`);
        
        if (response.ok) {
            const veiculo = await response.json();
            preencherFormularioParaEdicao(veiculo);
            mostrarSecao('criar');
            
            // Scroll para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            mostrarMensagem('Erro ao carregar dados do veículo.', 'error');
        }
    } catch (error) {
        mostrarMensagem(`Erro de conexão: ${error.message}`, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Função para preencher formulário para edição
function preencherFormularioParaEdicao(veiculo) {
    editandoVeiculo = veiculo.id;
    
    // Preencher campos básicos
    document.getElementById('modelo').value = veiculo.modelo;
    document.getElementById('fabricante').value = veiculo.fabricante;
    document.getElementById('ano').value = veiculo.ano;
    document.getElementById('preco').value = veiculo.preco;
    document.getElementById('cor').value = veiculo.cor;
    document.getElementById('tipo').value = veiculo.tipo;
    
    // Mostrar campos específicos
    toggleCamposEspecificos();
    
    // Preencher campos específicos
    if (veiculo.tipo === 'CARRO') {
        document.getElementById('quantidadePortas').value = veiculo.quantidadePortas;
        document.getElementById('tipoCombustivel').value = veiculo.tipoCombustivel;
    } else if (veiculo.tipo === 'MOTO') {
        document.getElementById('cilindrada').value = veiculo.cilindrada;
    }
    
    // Alterar interface para modo edição
    document.getElementById('form-title').textContent = `✏️ Editar Veículo #${veiculo.id}`;
    document.getElementById('submit-btn').innerHTML = '💾 Atualizar Veículo';
    document.getElementById('cancel-btn').classList.remove('hidden');
    
    mostrarMensagem(`Editando veículo: ${veiculo.modelo}`, 'success');
}

// Função para atualizar veículo
async function atualizarVeiculo() {
    if (!validarFormulario()) return;
    
    try {
        mostrarLoading(true);
        const dados = coletarDadosFormulario();
        
        const response = await fetch(`${API_BASE_URL}/veiculos/${editandoVeiculo}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        if (response.ok) {
            mostrarMensagem(`Veículo "${dados.modelo}" atualizado com sucesso!`, 'success');
            cancelarEdicao();
            listarTodosVeiculos();
            // Voltar para a página inicial
            setTimeout(() => mostrarSecao('home'), 1500);
        } else {
            const erro = await response.text();
            mostrarMensagem(`Erro ao atualizar veículo: ${erro}`, 'error');
        }
    } catch (error) {
        mostrarMensagem(`Erro de conexão: ${error.message}`, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Função para cancelar edição
function cancelarEdicao() {
    editandoVeiculo = false;
    limparFormulario();
    
    // Restaurar interface
    document.getElementById('form-title').textContent = '➕ Adicionar Novo Veículo';
    document.getElementById('submit-btn').innerHTML = '➕ Adicionar Veículo';
    document.getElementById('cancel-btn').classList.add('hidden');
}

// Função para confirmar exclusão
function confirmarExclusaoVeiculo(id) {
    veiculoParaExcluir = id;
    document.getElementById('confirmModal').classList.remove('hidden');
}

// Função para confirmar exclusão no modal
async function confirmarExclusao() {
    if (!veiculoParaExcluir) return;
    
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/veiculos/${veiculoParaExcluir}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            mostrarMensagem('Veículo excluído com sucesso!', 'success');
            listarTodosVeiculos();
            
            // Limpar resultado da busca se estiver na seção de busca
            if (document.getElementById('secao-buscar').classList.contains('active')) {
                document.getElementById('search-result').innerHTML = '';
                document.getElementById('searchId').value = '';
            }
            
            // Limpar resultado dos filtros se estiver na seção de filtros
            if (document.getElementById('secao-filtros').classList.contains('active')) {
                document.getElementById('filter-result').innerHTML = '';
            }
        } else {
            mostrarMensagem('Erro ao excluir veículo.', 'error');
        }
    } catch (error) {
        mostrarMensagem(`Erro de conexão: ${error.message}`, 'error');
    } finally {
        mostrarLoading(false);
    }
    
    fecharModal();
}

// Função para fechar modal
function fecharModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    veiculoParaExcluir = null;
}

// Função para limpar formulário
function limparFormulario() {
    document.getElementById('vehicleForm').reset();
    document.getElementById('campos-carro').classList.add('hidden');
    document.getElementById('campos-moto').classList.add('hidden');
    
    // Remover obrigatoriedade dos campos específicos
    document.getElementById('quantidadePortas').required = false;
    document.getElementById('tipoCombustivel').required = false;
    document.getElementById('cilindrada').required = false;
}

// Função utilitária para debounce (evitar muitas chamadas)
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

// Adicionar funcionalidade de busca em tempo real (opcional)
const debouncedSearch = debounce(() => {
    const id = document.getElementById('searchId').value;
    if (id && id.length > 0) {
        buscarVeiculo();
    }
}, 500);

// Event listener para busca em tempo real (descomentado se desejar)
// document.getElementById('searchId').addEventListener('input', debouncedSearch);