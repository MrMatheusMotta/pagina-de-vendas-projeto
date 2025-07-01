        document.getElementById('cep').addEventListener('blur', function () {
            var cep = this.value.replace(/\D/g, ''); 

            if (cep.length === 8) { 
                var url = `https://viacep.com.br/ws/${cep}/json/`;

                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        if (data.erro) {
                            alert('CEP não encontrado!');
                        } else {
                            document.getElementById('rua').value = data.logradouro;
                            document.getElementById('bairro').value = data.bairro;
                            document.getElementById('cidade').value = data.localidade;
                            document.getElementById('estado').value = data.uf;
                        }
                    })
                    .catch(error => {
                        alert('Erro ao buscar o CEP!');
                        console.log(error);
                    });
            } else {
                alert('CEP inválido!');
            }
        });