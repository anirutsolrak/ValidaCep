import React, { useState, useEffect } from "react";
import Header from './components/Header';
import ApiStatusAlert from './components/ApiStatusAlert';
import TabPanel from './components/TabPanel';
import SingleSearch from './components/SingleSearch';
import { checkApiStatus } from "./utils/cepApi";
import BatchSearch  from './components/BatchSearch'



function App() {
  const [activeTab, setActiveTab] = useState('single');
  const [apiStatuses, setApiStatuses] = useState({
      viacep: { status: 'checking', down: false },
      awesomeapi: { status: 'checking', down: false },
      brasilapi: { status: 'checking', down: false }
  });

  useEffect(() => {
      checkApisHealth();
  }, []);

  const checkApisHealth = async () => {
      setApiStatuses({
          viacep: { status: 'checking', down: false },
          awesomeapi: { status: 'checking', down: false },
          brasilapi: { status: 'checking', down: false }
      });

      console.log("checkApisHealth: Starting API status checks...");

      const viacepStatus = await checkApiStatus('viacep');
      console.log(`checkApisHealth: ViaCEP status: ${viacepStatus}`);
      const awesomeapiStatus = await checkApiStatus('awesomeapi');
      console.log(`checkApisHealth: AwesomeAPI status: ${awesomeapiStatus}`);
      const brasilapiStatus = await checkApiStatus('brasilapi');
      console.log(`checkApisHealth: BrasilAPI status: ${brasilapiStatus}`);


      setApiStatuses({
          viacep: { status: 'ready', down: !viacepStatus },
          awesomeapi: { status: 'ready', down: !awesomeapiStatus },
          brasilapi: { status: 'ready', down: !brasilapiStatus }
      });

      console.log("checkApisHealth: API statuses updated:", apiStatuses);
  };

  return (
      <div data-name="app" className="min-h-screen bg-gray-50">
          <Header />
          <ApiStatusAlert apiStatuses={apiStatuses} />
          <main className="container mx-auto px-4 py-8">
              <TabPanel activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === 'single' ? <SingleSearch apiStatuses={apiStatuses} selectedCards={activeTab === 'single' ? { 'ViaCEP': true, 'AwesomeAPI': true, 'BrasilAPI': true } : {}} apiDown={apiStatuses.viacep.down} /> : <BatchSearch apiStatuses={apiStatuses} />}
          </main>
      </div>
  );
}

export default App;