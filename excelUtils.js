// --- START OF FILE excelUtils.js ---
function generateExcel(data, selectedCards) {
    try {
        const wb = XLSX.utils.book_new();
        const ws_data = [
            ['', selectedCards['ViaCEP'] ? 'ViaCEP' : '', '', '', '', selectedCards['AwesomeAPI'] ? 'AwesomeAPI' : '', '', '', '', selectedCards['BrasilAPI'] ? 'BrasilAPI' : '', '', '', ''], // API Name Header Row
            ['CEP', selectedCards['ViaCEP'] ? 'Logradouro' : '', selectedCards['ViaCEP'] ? 'Bairro' : '', selectedCards['ViaCEP'] ? 'Cidade' : '', selectedCards['ViaCEP'] ? 'Estado' : '',  // Data Field Header Row 1
             selectedCards['AwesomeAPI'] ? 'Endereço' : '', selectedCards['AwesomeAPI'] ? 'Bairro' : '', selectedCards['AwesomeAPI'] ? 'Cidade' : '', selectedCards['AwesomeAPI'] ? 'Estado' : '',
             selectedCards['BrasilAPI'] ? 'Rua' : '', selectedCards['BrasilAPI'] ? 'Bairro' : '', selectedCards['BrasilAPI'] ? 'Cidade' : '', selectedCards['BrasilAPI'] ? 'Estado' : '']
        ];


        const merges = [];
        let mergeStartColumn = 1; // Start column index for API name merging

        if (selectedCards['ViaCEP']) {
            merges.push({ s: { r: 0, c: mergeStartColumn }, e: { r: 0, c: mergeStartColumn + 3 } }); // ViaCEP
             mergeStartColumn += 4;
        }
        if (selectedCards['AwesomeAPI']) {
            merges.push({ s: { r: 0, c: mergeStartColumn }, e: { r: 0, c: mergeStartColumn + 3 } }); // AwesomeAPI
             mergeStartColumn += 4;
        }
        if (selectedCards['BrasilAPI']) {
            merges.push({ s: { r: 0, c: mergeStartColumn }, e: { r: 0, c: mergeStartColumn + 3 } }); // BrasilAPI
             mergeStartColumn += 4;
        }


        data.forEach(item => {
            const dataRow = [item.cep];

            const viaCepData = item.results.find(res => res.source === 'viacep');
            if (selectedCards['ViaCEP']) {
                dataRow.push(viaCepData?.error ? 'Não encontrado' : (viaCepData?.logradouro || '-'));
                dataRow.push(viaCepData?.error ? 'Não encontrado' : (viaCepData?.bairro || '-'));
                dataRow.push(viaCepData?.error ? 'Não encontrado' : (viaCepData?.localidade || '-'));
                dataRow.push(viaCepData?.error ? 'Não encontrado' : (viaCepData?.uf || '-'));
            }

            const awesomeApiData = item.results.find(res => res.source === 'awesomeapi');
            if (selectedCards['AwesomeAPI']) {
                dataRow.push(awesomeApiData?.error ? 'Não encontrado' : (awesomeApiData?.address || '-'));
                dataRow.push(awesomeApiData?.error ? 'Não encontrado' : (awesomeApiData?.district || '-'));
                dataRow.push(awesomeApiData?.error ? 'Não encontrado' : (awesomeApiData?.city || '-'));
                dataRow.push(awesomeApiData?.error ? 'Não encontrado' : (awesomeApiData?.state || '-'));
            }

            const brasilApiData = item.results.find(res => res.source === 'brasilapi');
             if (selectedCards['BrasilAPI']) {
                dataRow.push(brasilApiData?.error ? 'Não encontrado' : (brasilApiData?.street || '-'));
                dataRow.push(brasilApiData?.error ? 'Não encontrado' : (brasilApiData?.neighborhood || '-'));
                dataRow.push(brasilApiData?.error ? 'Não encontrado' : (brasilApiData?.city || '-'));
                dataRow.push(brasilApiData?.error ? 'Não encontrado' : (brasilApiData?.state || '-'));
            }
            ws_data.push(dataRow);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!merges'] = merges; // Apply merges here

        XLSX.utils.book_append_sheet(wb, ws, 'Resultados CEP');

        let wbout;
        try {
            wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        } catch (e) {
            console.error("Error writing as 'xlsx', trying 'excel'", e);
            wbout = XLSX.write(wb, { bookType: 'excel', type: 'array' }); // Fallback to 'excel'
        }

        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'resultados_cep.xlsx';
        link.click();

    } catch (error) {
        reportError(error);
        throw error;
    }
}


function parseExcelFile(file) {
    try {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split('\n');
                const headers = lines[0].toLowerCase().split(',');
                const cepIndex = headers.indexOf('cep');

                if (cepIndex === -1) {
                    reject(new Error('Arquivo deve conter uma coluna "cep"'));
                    return;
                }

                const ceps = lines.slice(1)
                    .map(line => line.split(',')[cepIndex])
                    .filter(cep => cep && cep.trim());

                resolve(ceps);
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    } catch (error) {
        reportError(error);
        throw error;
    }
}
// --- END OF FILE excelUtils.js ---