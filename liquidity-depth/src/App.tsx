import CEXpanel from './components/CEXpanel';
import DEXpanel from './components/DEXpanel';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import liquidityDepthFavi from './assets/liquiditydepthfavi.png';

function App() {
  return (
    <div className="min-h-screen bg-purple-50 p-5">
      <header className="bg-gradient-to-r from-purple-700 to-purple-900 py-0 px-4 shadow-lg rounded-lg flex justify-center items-center mb-6">
        <img 
          src={liquidityDepthFavi} 
          alt="Liquidity Depth Logo" 
          className="h-16 w-16 mr-4 filter hue-rotate-60 brightness-95"
        />
        <h1 className="text-3xl font-bold text-center text-white tracking-wider font-['Press_Start_2P']">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-white">
            LIQUIDITYDEPTH.XYZ
          </span>
        </h1>
      </header>

      <Tabs
        className="bg-white shadow-lg rounded-lg p-6"
        selectedTabClassName="bg-purple-700 text-white"
      >
        <TabList className="flex w-full border-b border-purple-200 mb-4">
          <Tab className="flex-1 px-6 py-3 font-semibold cursor-pointer hover:bg-purple-100 rounded-t-lg transition-colors duration-200 focus:outline-none text-center text-purple-800">
            CEX
          </Tab>
          <Tab className="flex-1 px-6 py-3 font-semibold cursor-pointer hover:bg-purple-100 rounded-t-lg transition-colors duration-200 focus:outline-none text-center text-purple-800">
            DEX
          </Tab>
        </TabList>

        <TabPanel>
          <CEXpanel />
        </TabPanel>
        <TabPanel>
          <DEXpanel />
        </TabPanel>
      </Tabs>
    </div>
  )
}

export default App



