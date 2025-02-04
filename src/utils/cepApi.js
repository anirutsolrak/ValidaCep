async function fetchViaCep(cep) {
    console.log("Fetching ViaCEP for:", cep);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json`);
        if (!response.ok) {
          console.error(`ViaCEP HTTP error! status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.erro) {
          console.warn("ViaCEP: CEP not found:", cep);
          return { error: 'CEP não encontrado', source: 'viacep' };
        }
          console.log("ViaCEP Success for:", cep, data);
        return { ...data, source: 'viacep' };
      } catch (error) {
        console.error("ViaCEP Error:", error);
        reportError(error);
        return { error: error.message, source: 'viacep' };
      }
  }
  
  async function fetchAwesomeApi(cep) {
    console.log("Fetching AwesomeAPI for:", cep);
    try {
      const response = await fetch(`https://cep.awesomeapi.com.br/json/${cep}`);
      if (!response.ok) {
          console.error(`AwesomeAPI HTTP error! status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
        console.log("AwesomeAPI Success for:", cep, data);
      return { ...data, source: 'awesomeapi' };
    } catch (error) {
        console.error("AwesomeAPI Error:", error);
      reportError(error);
      return { error: error.message, source: 'awesomeapi' };
    }
  }
  
  async function fetchBrasilApi(cep) {
    console.log("Fetching BrasilAPI for:", cep);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      if (!response.ok) {
        console.error(`BrasilAPI HTTP error! status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
        console.log("BrasilAPI Success for:", cep, data);
      return { ...data, source: 'brasilapi' };
    } catch (error) {
        console.error("BrasilAPI Error:", error);
      reportError(error);
      return { error: error.message, source: 'brasilapi' };
    }
  }
  
  async function consultCep(cep, apisToCheck = ['viacep', 'awesomeapi', 'brasilapi']) {
      const results = [];
      if (apisToCheck.includes('viacep')) {
        try {
          const result = await fetchViaCep(cep);
          results.push(result);
        } catch (error) {
          results.push({ error: error.message, source: 'viacep' });
        }
      }
      if (apisToCheck.includes('awesomeapi')) {
        try {
          const result = await fetchAwesomeApi(cep);
          results.push(result);
        } catch (error) {
          results.push({ error: error.message, source: 'awesomeapi' });
        }
      }
      if (apisToCheck.includes('brasilapi')) {
        try {
          const result = await fetchBrasilApi(cep);
          results.push(result);
        } catch (error) {
          results.push({ error: error.message, source: 'brasilapi' });
        }
      }
      return results;
  }
  
  
  async function checkApiStatus(apiName) {
      let url;
      switch (apiName) {
          case 'viacep':
              url = 'https://viacep.com.br/ws/01001000/json/';
              break;
          case 'awesomeapi':
              url = 'https://cep.awesomeapi.com.br/json/01001000';
              break;
          case 'brasilapi':
              url = 'https://brasilapi.com.br/api/cep/v1/01001000';
              break;
          default:
              console.log(`checkApiStatus: Unknown API name: ${apiName}`);
              return false;
      }
  
      console.log(`checkApiStatus: Checking status for ${apiName} at URL: ${url}`);
  
      try {
          const response = await fetch(url);
          const status = response.ok;
          console.log(`checkApiStatus: ${apiName} status check response.ok: ${status}, status code: ${response.status}`);
          return status;
      } catch (error) {
          console.error(`checkApiStatus: Error checking status for ${apiName}: ${error.message}`);
          return false;
      }
  }
  export { consultCep, checkApiStatus }