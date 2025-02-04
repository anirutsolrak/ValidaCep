import * as XLSX from 'xlsx';
import { consultCep } from './cepApi'; // Ajuste o path

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


async function validateExcelData(file) {
    console.log("validateExcelData: Starting data validation from Excel file");
    try {
        const workbook = await readExcelFile(file);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });


        if (!excelData || excelData.length <= 1) {
            console.warn("validateExcelData: No data found in the excel file or only headers provided.")
            return { results: [], summary: { processed: 0, validated: 0, failed: 0 }};
        }
        const headerRow = excelData[0].map(String);
        const dataRows = excelData.slice(1);


        const cepColumnIndex = headerRow.findIndex(header => header.toLowerCase() === "cep");
        const cidadeColumnIndex = headerRow.findIndex(header => header.toLowerCase() === "cidade");
       const enderecoColumnIndex = headerRow.findIndex(header => header.toLowerCase() === "enderecocliente");
        const estadoColumnIndex = headerRow.findIndex(header => header.toLowerCase() === "estado");


        if (cepColumnIndex === -1) {
            throw new Error("validateExcelData: Column 'cep' not found in the excel file");
        }
            if (cidadeColumnIndex === -1) {
            throw new Error("validateExcelData: Column 'cidade' not found in the excel file");
        }
         if (estadoColumnIndex === -1) {
            throw new Error("validateExcelData: Column 'estado' not found in the excel file");
        }
         if (enderecoColumnIndex === -1) {
            throw new Error("validateExcelData: Column 'enderecocliente' not found in the excel file");
        }


        const validationResults = [];
        let processedCount = 0;
        let validatedCount = 0;
        let failedCount = 0;

        for (const row of dataRows) {
            processedCount++;
            try{
              const cep = String(row[cepColumnIndex]).trim();
              const expectedCidade = String(row[cidadeColumnIndex]).trim();
              const expectedEstado = String(row[estadoColumnIndex]).trim();
               const expectedEndereco = String(row[enderecoColumnIndex]).trim();


              if(!cep){
                console.warn("validateExcelData: Skipping row with invalid cep",row);
                validationResults.push({ ...row, validation: 'CEP Inválido'});
                failedCount++;
                continue;
              }
            console.log(`validateExcelData: Processing cep ${cep} , city: ${expectedCidade}, state ${expectedEstado}, address: ${expectedEndereco}`);
                const apiResults = await consultCep(cep);

              // Verifica qual API retornou um resultado
              const successfulResult = apiResults.find(result => !result.error);
              let validation = 'Não encontrado';

            if (successfulResult) {
                const apiCidade = successfulResult.localidade || successfulResult.city ;
                const apiEstado = successfulResult.uf || successfulResult.state;
                const apiEndereco = successfulResult.logradouro || successfulResult.address || successfulResult.street;


            const cidadeMatch = apiCidade && apiCidade.trim() === expectedCidade;
            const estadoMatch = apiEstado && apiEstado.trim() === expectedEstado;
                const enderecoMatch = apiEndereco && apiEndereco.trim() === expectedEndereco;



            if(cidadeMatch && estadoMatch && enderecoMatch){
                  validation = 'Sucesso';
                   validatedCount++;
               } else{
                     validation = 'Falha';
                    failedCount++
               }

            validationResults.push({
                    ...row,
                    validation: validation,
                    apiCidade: apiCidade || '-',
                    apiEstado: apiEstado || '-',
                   apiEndereco: apiEndereco || '-'
              });

           } else{
             console.warn("validateExcelData: API fetch failed for cep:", cep);
              validationResults.push({ ...row, validation: 'Falha ao buscar na API'});
                 failedCount++;
           }

           } catch (error) {
            console.error("validateExcelData: Error processing row:", error)
                validationResults.push({ ...row, validation: 'Erro ao validar linha', error: error.message});
             failedCount++;
             }
        }

         console.log("validateExcelData: Validation process completed");

        const summary = {
            processed: processedCount,
            validated: validatedCount,
            failed: failedCount,
        };
        return { results: validationResults, summary: summary };
    } catch (error) {
        console.error("validateExcelData: General Error during data validation", error);
        throw error;
    }
}
// Função auxiliar para ler o arquivo Excel
function readExcelFile(file) {
  console.log("readExcelFile: Starting to read the excel file")
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try{
                    console.log("readExcelFile: File read success")
                 const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    resolve(workbook);
                } catch (error) {
                    console.error("readExcelFile: Error parsing excel", error)
                 reject(new Error("Erro ao ler ou interpretar o arquivo Excel"));
                }

            };
            reader.onerror = (error) => {
                console.error("readExcelFile: Error during read", error);
                reject(new Error('Erro ao ler arquivo'));
            }
             reader.readAsBinaryString(file);
        } catch (error) {
            console.error("readExcelFile: Outer error during readExcelFile", error);
            reject(error)
        }
    });
}

function generateValidationExcel(data, originalHeaders) {
   console.log("generateValidationExcel: Starting excel generation");
    try {
        const wb = XLSX.utils.book_new();
          const headers = [...originalHeaders, "Validação", "API Cidade", "API Estado", "API Endereço"]
        const ws_data = [headers];

        data.forEach(item => {
            const row = [...item]; // Copia os dados originais

          row.push(item.validation);
          row.push(item.apiCidade || '');
          row.push(item.apiEstado || '');
           row.push(item.apiEndereco || '');

            ws_data.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, 'Validação CEP');

        let wbout;
        try {
           console.log("generateValidationExcel: Writing workbook as 'xlsx'");
            wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        } catch (e) {
            console.error("generateValidationExcel: Error writing as 'xlsx', trying 'excel'", e);
            wbout = XLSX.write(wb, { bookType: 'excel', type: 'array' });
        }
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'validação_cep.xlsx';
        link.click();
      console.log("generateValidationExcel: Excel file generated successfully");
    } catch (error) {
       console.error("generateValidationExcel: General Error during excel generation", error)
        throw error;
    }
}
export { validateExcelData, generateValidationExcel, generateExcel };