let produtosGlobais = [];
let carrinho = [];

let currentIndex = 0;
let carrosselProdutos = [];
let carouselInterval;
const CARROUSSEL_DISPLAY_COUNT = 3;
const AUTOPLAY_INTERVAL = 2000;

function salvarCarrinho() {
    localStorage.setItem('carrinhoLumo', JSON.stringify(carrinho));
}

function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinhoLumo');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
        if (document.getElementById('itens-carrinho')) {
            atualizarExibicaoCarrinho(); 
        }
    }
    const contadorCarrinhoElement = document.getElementById('contador-carrinho');
    if (contadorCarrinhoElement) {
        const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        contadorCarrinhoElement.textContent = totalItens;
    }
}

function criarCardProduto(produto, isCarrossel = false) {
    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card');
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
    botaoCarrinho.dataset.id = produto.ID;

    const iconeCarrinho = document.createElement('i');
    iconeCarrinho.classList.add('fas', 'fa-shopping-cart');

    botaoCarrinho.appendChild(iconeCarrinho); 
    acoesProdutoDiv.appendChild(botaoCarrinho);

    produtoDiv.appendChild(img);
    produtoDiv.appendChild(h3);
    produtoDiv.appendChild(pDetalhe);
    produtoDiv.appendChild(pPreco);
    produtoDiv.appendChild(acoesProdutoDiv);

    return produtoDiv;
}

async function carregarEExibirProdutos() {
    if (document.getElementById('loja')) {
        try {
            const response = await fetch('produtos.json');
            if (!response.ok) {
                throw new Error(`Erro ao carregar produtos: Status ${response.status}`);
            }
            produtosGlobais = await response.json();
            const lojaContainer = document.getElementById('loja');
            lojaContainer.innerHTML = '';
            produtosGlobais.forEach(produto => {
                const produtoCard = criarCardProduto(produto);
                lojaContainer.appendChild(produtoCard);
            });
            document.querySelectorAll('.botao-carrinho').forEach(button => {
                button.addEventListener('click', adicionarAoCarrinho);
            });
            carregarCarrossel();
        } catch (error) {
            console.error('Ops! Não foi possível carregar os produtos:', error);
            const lojaContainer = document.getElementById('loja');
            lojaContainer.innerHTML = '<p>Não foi possível carregar os produtos no momento. Tente novamente mais tarde.</p>';
        }
    }
}

function showToast(produtoNome, acao) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
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
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

function adicionarAoCarrinho(event) {
    const produtoId = parseInt(event.currentTarget.dataset.id);
    const produtoExistente = carrinho.find(item => item.ID === produtoId);
    const produtoAdicionado = produtosGlobais.find(p => p.ID === produtoId);
    if (produtoExistente) {
        produtoExistente.quantidade++;
    } else {
        if (produtoAdicionado) {
            carrinho.push({ ...produtoAdicionado, quantidade: 1 });
        }
    }
    salvarCarrinho();
    atualizarExibicaoCarrinho();
    if (produtoAdicionado) {
        showToast(produtoAdicionado.PRODUTO, 'adicionado');
    }
}

function removerDoCarrinho(event) {
    const produtoId = parseInt(event.currentTarget.dataset.id);
    const itemIndex = carrinho.findIndex(item => item.ID === produtoId);
    const produtoRemovido = carrinho[itemIndex];
    if (itemIndex > -1) {
        if (carrinho[itemIndex].quantidade > 1) {
            carrinho[itemIndex].quantidade--;
            if (produtoRemovido) showToast(produtoRemovido.PRODUTO, 'removido');
        } else {
            carrinho.splice(itemIndex, 1);
            if (produtoRemovido) showToast(produtoRemovido.PRODUTO, 'removido');
        }
    }
    salvarCarrinho();
    atualizarExibicaoCarrinho();
}

// NOVA FUNÇÃO: Deletar item do carrinho (remover tudo de uma vez)
function deletarDoCarrinho(event) {
    const produtoId = parseInt(event.currentTarget.dataset.id);
    const itemIndex = carrinho.findIndex(item => item.ID === produtoId);
    if (itemIndex > -1) {
        const produtoRemovido = carrinho[itemIndex];
        carrinho.splice(itemIndex, 1);
        salvarCarrinho();
        atualizarExibicaoCarrinho();
        if (produtoRemovido) showToast(produtoRemovido.PRODUTO, 'removido');
    }
}

function atualizarExibicaoCarrinho() {
    const itensCarrinhoContainer = document.getElementById('itens-carrinho');
    const valorTotalElement = document.getElementById('valor-total-carrinho');
    const contadorCarrinhoElement = document.getElementById('contador-carrinho');
    if (!itensCarrinhoContainer || !valorTotalElement || !contadorCarrinhoElement) {
        const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        if (contadorCarrinhoElement) {
            contadorCarrinhoElement.textContent = totalItens;
        }
        return;
    }
    itensCarrinhoContainer.innerHTML = '';
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
                <button class="btn-remover-carrinho" data-id="${item.ID}" title="Diminuir quantidade">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="btn-deletar-carrinho" data-id="${item.ID}" title="Remover do carrinho" style="color:#e53935;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            itensCarrinhoContainer.appendChild(itemDiv);
        });
        document.querySelectorAll('.btn-remover-carrinho').forEach(button => {
            button.addEventListener('click', removerDoCarrinho);
        });
        document.querySelectorAll('.btn-deletar-carrinho').forEach(button => {
            button.addEventListener('click', deletarDoCarrinho);
        });
    }
    valorTotalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    contadorCarrinhoElement.textContent = totalItens;
}

function carregarCarrossel() {
    const carrosselContainer = document.getElementById('carrossel-produtos');
    const prevButton = document.querySelector('.carrossel-btn.prev');
    const nextButton = document.querySelector('.carrossel-btn.next');
    if (!carrosselContainer || !prevButton || !nextButton) return;
    carrosselContainer.innerHTML = '';
    clearInterval(carouselInterval);
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
    const numClones = CARROUSSEL_DISPLAY_COUNT;
    const clonedProducts = [
        ...carrosselProdutos.slice(-numClones),
        ...carrosselProdutos,
        ...carrosselProdutos.slice(0, numClones)
    ];
    clonedProducts.forEach(produto => {
        const produtoCard = criarCardProduto(produto, true);
        carrosselContainer.appendChild(produtoCard);
    });
    carrosselContainer.querySelectorAll('.botao-carrinho').forEach(button => {
        button.addEventListener('click', adicionarAoCarrinho);
    });
    currentIndex = numClones; 
    updateCarrosselPosition(false);
    prevButton.onclick = () => moveCarrossel(-1);
    nextButton.onclick = () => moveCarrossel(1);
    startAutoplay();
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
    carrossel.style.transition = useTransition ? 'transform 0.5s ease-in-out' : 'none';
    carrossel.style.transform = `translateX(${-currentIndex * produtoWidth}px)`;
    if (useTransition) {
        requestAnimationFrame(() => {
            if (currentIndex >= carrosselProdutos.length + CARROUSSEL_DISPLAY_COUNT) {
                setTimeout(() => {
                    currentIndex = CARROUSSEL_DISPLAY_COUNT;
                    updateCarrosselPosition(false);
                }, 500);
            } else if (currentIndex < CARROUSSEL_DISPLAY_COUNT) {
                setTimeout(() => {
                    currentIndex = carrosselProdutos.length + CARROUSSEL_DISPLAY_COUNT - 1;
                    updateCarrosselPosition(false);
                }, 500);
            }
        });
    }
}

function moveCarrossel(direction) {
    clearInterval(carouselInterval);
    currentIndex += direction;
    updateCarrosselPosition(true);
    startAutoplay();
}

function startAutoplay() {
    stopAutoplay();
    carouselInterval = setInterval(() => {
        if (currentIndex >= carrosselProdutos.length + CARROUSSEL_DISPLAY_COUNT - 1) {
            currentIndex++;
            updateCarrosselPosition(true);
        } else {
            moveCarrossel(1);
        }
    }, AUTOPLAY_INTERVAL);
}

function stopAutoplay() {
    clearInterval(carouselInterval);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarCarrinho();
    carregarEExibirProdutos();
});