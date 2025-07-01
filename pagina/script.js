// Variáveis globais para armazenar os produtos e o carrinho
let produtosGlobais = [];
let carrinho = [];

// Variáveis para o carrossel
let currentIndex = 0; // Índice do produto *real* que está sendo exibido
let carrosselProdutos = []; // Produtos de oferta
let carouselInterval; // Variável para armazenar o ID do intervalo do carrossel
const CARROUSSEL_DISPLAY_COUNT = 3; // Quantos produtos queremos exibir por vez no carrossel
const AUTOPLAY_INTERVAL = 4000; // 4 segundos para a transição automática

// Função para salvar o carrinho no Local Storage
function salvarCarrinho() {
    localStorage.setItem('carrinhoLumo', JSON.stringify(carrinho));
}

// Função para carregar o carrinho do Local Storage
function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinhoLumo');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
        // Só atualiza a exibição completa do carrinho se estiver na página principal
        if (document.getElementById('itens-carrinho')) {
            atualizarExibicaoCarrinho(); 
        }
    }
    // Sempre atualiza o contador do carrinho no header, independente da página
    const contadorCarrinhoElement = document.getElementById('contador-carrinho');
    if (contadorCarrinhoElement) {
        const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        contadorCarrinhoElement.textContent = totalItens;
    }
}

// Função para renderizar um único produto (usada para loja e carrossel)
function criarCardProduto(produto, isCarrossel = false) {
    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card'); // Classe comum para estilização
    if (isCarrossel) {
        produtoDiv.classList.add('produto-carrossel');
    }

    const img = document.createElement('img');
    img.src = produto.IMAGEM;
    img.alt = produto.PRODUTO;

    const h3 = document.createElement('h3');
    h3.textContent = produto.PRODUTO;

    const pDetalhe = document.createElement('p');
    pDetalhe.textContent = produto.DETALHE;

    const pPreco = document.createElement('p');
    pPreco.classList.add('produto-preco');
    pPreco.textContent = `R$ ${produto.PRECO.toFixed(2).replace('.', ',')}`;

    const acoesProdutoDiv = document.createElement('div');
    acoesProdutoDiv.classList.add('acoes-produto');

    const botaoCarrinho = document.createElement('button');
    botaoCarrinho.classList.add('botao-carrinho');
    botaoCarrinho.title = "Adicionar ao carrinho";
    botaoCarrinho.dataset.id = produto.ID; // Armazena o ID do produto no botão

    const iconeCarrinho = document.createElement('i');
    iconeCarrinho.classList.add('fas', 'fa-shopping-cart');

    // CORREÇÃO AQUI: era 'iconeCarrone'
    botaoCarrinho.appendChild(iconeCarrinho); 
    acoesProdutoDiv.appendChild(botaoCarrinho);

    produtoDiv.appendChild(img);
    produtoDiv.appendChild(h3);
    produtoDiv.appendChild(pDetalhe);
    produtoDiv.appendChild(pPreco);
    produtoDiv.appendChild(acoesProdutoDiv);

    return produtoDiv;
}

// Função para carregar e exibir os produtos na loja principal (apenas no home.html)
async function carregarEExibirProdutos() {
    // Verifica se estamos na página principal (home.html) para carregar os produtos
    if (document.getElementById('loja')) { // O elemento 'loja' só existe no home.html
        try {
            const response = await fetch('produtos.json');
            
            // Verifica se a requisição foi bem-sucedida ANTES de tentar parsear
            if (!response.ok) {
                // Lança um erro para ser pego pelo catch e mostrar a mensagem amigável
                throw new Error(`Erro ao carregar produtos: Status ${response.status}`);
            }
            
            produtosGlobais = await response.json(); // Armazena todos os produtos globalmente

            const lojaContainer = document.getElementById('loja');
            lojaContainer.innerHTML = ''; // Limpa qualquer conteúdo existente

            produtosGlobais.forEach(produto => {
                const produtoCard = criarCardProduto(produto);
                lojaContainer.appendChild(produtoCard);
            });

            // Configura os ouvintes de evento para os botões de adicionar ao carrinho
            // Deve ser feito APÓS todos os produtos serem adicionados ao DOM
            document.querySelectorAll('.botao-carrinho').forEach(button => {
                button.addEventListener('click', adicionarAoCarrinho);
            });

            carregarCarrossel(); // Chama a função para carregar o carrossel
            
        } catch (error) {
            console.error('Ops! Não foi possível carregar os produtos:', error);
            const lojaContainer = document.getElementById('loja');
            lojaContainer.innerHTML = '<p>Não foi possível carregar os produtos no momento. Tente novamente mais tarde.</p>';
        }
    }
}

// --- Funções do Carrinho ---

// Função para exibir um toast (mini-carrinho)
function showToast(produtoNome, acao) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return; // Não faz nada se o container não existe

    const toast = document.createElement('div');
    toast.classList.add('toast-notificacao');

    let mensagem = '';
    if (acao === 'adicionado') {
        mensagem = `<i class="fas fa-check-circle"></i> "${produtoNome}" adicionado ao carrinho!`;
        toast.classList.add('toast-adicionado');
    } else if (acao === 'removido') {
        mensagem = `<i class="fas fa-trash-alt"></i> "${produtoNome}" removido do carrinho.`;
        toast.classList.add('toast-removido');
    }
    
    toast.innerHTML = mensagem;
    toastContainer.appendChild(toast);

    // Remove o toast após alguns segundos
    setTimeout(() => {
        toast.classList.add('hide'); // Adiciona classe para animação de fade-out
        toast.addEventListener('transitionend', () => toast.remove()); // Remove do DOM após a transição
    }, 3000); // 3 segundos
}

// Função para adicionar um produto ao carrinho
function adicionarAoCarrinho(event) {
    const produtoId = parseInt(event.currentTarget.dataset.id);
    const produtoExistente = carrinho.find(item => item.ID === produtoId);
    const produtoAdicionado = produtosGlobais.find(p => p.ID === produtoId); // Pega o produto original

    if (produtoExistente) {
        produtoExistente.quantidade++;
    } else {
        if (produtoAdicionado) {
            carrinho.push({ ...produtoAdicionado, quantidade: 1 });
        }
    }
    salvarCarrinho();
    atualizarExibicaoCarrinho(); // Isso também atualiza o contador
    if (produtoAdicionado) {
        showToast(produtoAdicionado.PRODUTO, 'adicionado'); // Mostra o toast
    }
}

// Função para remover um produto do carrinho (ou diminuir a quantidade)
function removerDoCarrinho(event) {
    const produtoId = parseInt(event.currentTarget.dataset.id);
    const itemIndex = carrinho.findIndex(item => item.ID === produtoId);
    const produtoRemovido = carrinho[itemIndex]; // Pega o produto antes de remover/diminuir

    if (itemIndex > -1) {
        if (carrinho[itemIndex].quantidade > 1) {
            carrinho[itemIndex].quantidade--;
            if (produtoRemovido) showToast(produtoRemovido.PRODUTO, 'removido');
        } else {
            carrinho.splice(itemIndex, 1); // Remove o item se a quantidade for 1
            if (produtoRemovido) showToast(produtoRemovido.PRODUTO, 'removido');
        }
    }
    salvarCarrinho();
    atualizarExibicaoCarrinho(); // Isso também atualiza o contador
}

// Função para atualizar a exibição do carrinho (apenas no home.html)
function atualizarExibicaoCarrinho() {
    const itensCarrinhoContainer = document.getElementById('itens-carrinho');
    const valorTotalElement = document.getElementById('valor-total-carrinho');
    const contadorCarrinhoElement = document.getElementById('contador-carrinho');

    // Se os elementos não existirem (não estamos na página principal), apenas atualiza o contador do header
    if (!itensCarrinhoContainer || !valorTotalElement || !contadorCarrinhoElement) {
        const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        if (contadorCarrinhoElement) { // Verifica novamente, caso o elemento não exista (p.ex. em páginas que não tem o header completo)
            contadorCarrinhoElement.textContent = totalItens;
        }
        return;
    }

    itensCarrinhoContainer.innerHTML = ''; // Limpa o conteúdo atual

    let total = 0;
    let totalItens = 0;

    if (carrinho.length === 0) {
        itensCarrinhoContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item-carrinho');
            
            const precoItem = item.PRECO * item.quantidade;
            total += precoItem;
            totalItens += item.quantidade;

            itemDiv.innerHTML = `
                <img src="${item.IMAGEM}" alt="${item.PRODUTO}">
                <span>${item.PRODUTO} (${item.DETALHE}) - ${item.quantidade}x</span>
                <span>R$ ${precoItem.toFixed(2).replace('.', ',')}</span>
                <button class="btn-remover-carrinho" data-id="${item.ID}">
                    <i class="fas fa-trash-alt"></i> </button>
            `;
            itensCarrinhoContainer.appendChild(itemDiv);
        });

        // Adiciona ouvintes de evento para os botões de remover após criar todos
        document.querySelectorAll('.btn-remover-carrinho').forEach(button => {
            button.addEventListener('click', removerDoCarrinho);
        });
    }

    valorTotalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    contadorCarrinhoElement.textContent = totalItens;
}

// --- Funções do Carrossel ---

function carregarCarrossel() {
    const carrosselContainer = document.getElementById('carrossel-produtos');
    const prevButton = document.querySelector('.carrossel-btn.prev');
    const nextButton = document.querySelector('.carrossel-btn.next');

    if (!carrosselContainer || !prevButton || !nextButton) return; // Não faz nada se os elementos não existem

    carrosselContainer.innerHTML = ''; // Limpa o conteúdo
    clearInterval(carouselInterval); // Limpa qualquer intervalo anterior

    carrosselProdutos = produtosGlobais.filter(produto => produto.OFERTA);

    if (carrosselProdutos.length === 0) {
        carrosselContainer.innerHTML = '<p>Nenhuma oferta disponível no momento.</p>';
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        return;
    } else {
        prevButton.style.display = 'block';
        nextButton.style.display = 'block';
    }

    // Calcula quantos clones precisamos em cada lado para um loop suave
    // Se temos 3 itens visíveis, precisamos de 3 clones no início e 3 no final
    const numClones = CARROUSSEL_DISPLAY_COUNT;

    // Duplica os itens para criar o efeito de loop infinito
    const clonedProducts = [
        ...carrosselProdutos.slice(-numClones), // Últimos N itens
        ...carrosselProdutos, // Itens originais
        ...carrosselProdutos.slice(0, numClones) // Primeiros N itens
    ];

    clonedProducts.forEach(produto => {
        const produtoCard = criarCardProduto(produto, true);
        carrosselContainer.appendChild(produtoCard);
    });

    // Adiciona ouvintes de evento para os botões de adicionar ao carrinho do carrossel
    // Devem ser adicionados após a criação de todos os cards, incluindo os clones
    carrosselContainer.querySelectorAll('.botao-carrinho').forEach(button => {
        button.addEventListener('click', adicionarAoCarrinho);
    });

    // Ajusta o currentIndex para o início dos produtos reais (ignorando os clones iniciais)
    currentIndex = numClones; 
    updateCarrosselPosition(false); // Não aplicar transição no carregamento inicial

    // Configura botões de navegação
    prevButton.onclick = () => moveCarrossel(-1);
    nextButton.onclick = () => moveCarrossel(1);

    // Inicia o auto-play
    startAutoplay();

    // Pausar/Retomar autoplay ao passar o mouse
    carrosselContainer.addEventListener('mouseenter', stopAutoplay);
    carrosselContainer.addEventListener('mouseleave', startAutoplay);
    prevButton.addEventListener('mouseenter', stopAutoplay);
    prevButton.addEventListener('mouseleave', startAutoplay);
    nextButton.addEventListener('mouseenter', stopAutoplay);
    nextButton.addEventListener('mouseleave', startAutoplay);
}

function updateCarrosselPosition(useTransition = true) {
    const carrossel = document.getElementById('carrossel-produtos');
    if (!carrossel) return;

    const firstProduct = carrossel.querySelector('.produto-carrossel');
    if (!firstProduct) return;

    const computedStyle = getComputedStyle(carrossel);
    const gap = parseFloat(computedStyle.gap);
    const produtoWidth = firstProduct.offsetWidth + gap;
    
    // Desativa/ativa a transição momentaneamente
    carrossel.style.transition = useTransition ? 'transform 0.5s ease-in-out' : 'none';
    carrossel.style.transform = `translateX(${-currentIndex * produtoWidth}px)`;

    // Lógica de "teletransporte" para criar o loop infinito
    if (useTransition) {
        // Usa requestAnimationFrame para garantir que a transição visual comece antes do timeout
        requestAnimationFrame(() => {
            if (currentIndex >= carrosselProdutos.length + CARROUSSEL_DISPLAY_COUNT) {
                // Chegou ao final das cópias, volta para o início dos produtos reais
                setTimeout(() => {
                    currentIndex = CARROUSSEL_DISPLAY_COUNT; // Volta para o primeiro item real
                    updateCarrosselPosition(false); // Sem transição para o teletransporte
                }, 500); // Duração da transição CSS
            } else if (currentIndex < CARROUSSEL_DISPLAY_COUNT) {
                // Chegou ao início das cópias, volta para o final dos produtos reais
                setTimeout(() => {
                    currentIndex = carrosselProdutos.length + CARROUSSEL_DISPLAY_COUNT - 1; // Volta para o último item real
                    updateCarrosselPosition(false); // Sem transição para o teletransporte
                }, 500); // Duração da transição CSS
            }
        });
    }
}

function moveCarrossel(direction) {
    clearInterval(carouselInterval); // Para o autoplay ao mover manualmente
    currentIndex += direction;
    updateCarrosselPosition(true);
    startAutoplay(); // Reinicia o autoplay após a interação manual
}

function startAutoplay() {
    stopAutoplay(); // Garante que não haja múltiplos intervalos rodando
    carouselInterval = setInterval(() => {
        // Se já está no último item visível dos produtos reais + clones, prepara para o teletransporte
        if (currentIndex >= carrosselProdutos.length + CARROUSSEL_DISPLAY_COUNT - 1) { // -1 para parar no último clone antes do teletransporte
            currentIndex++; // Vai para a posição que será teletransportada
            updateCarrosselPosition(true); // Com transição para o último movimento
        } else {
            moveCarrossel(1);
        }
    }, AUTOPLAY_INTERVAL);
}

function stopAutoplay() {
    clearInterval(carouselInterval);
}


// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    carregarEExibirProdutos(); // Carrega os produtos da loja (se estiver no home.html) e o carrossel
    carregarCarrinho(); // Carrega o carrinho salvo no Local Storage (atualiza o contador em todas as páginas)
});