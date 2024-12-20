import LiquidityChart from './LiquidityChart'; 
import {VolDist } from './VolDist'; 
import SpreadChart from './SpreadChart';
import {LiquidityScatterPlot} from './LiquidityScatterPlot';
import { OHLCVData, colors } from './types';

function MasterCEX({ chartData, selectedExchanges, colors }: { chartData: OHLCVData[], selectedExchanges: string[], colors: colors }) {
    const exchange_set : Set<string> = new Set();

	for (const val of chartData) {
		exchange_set.add(val.exchange);
	}
    
    return (
        <div className="flex flex-col gap-6 p-6 bg-gray-950">
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 rounded-lg bg-gray-900 p-4 shadow-lg border border-purple-900/50">
                    <LiquidityChart 
                        chartData={chartData} 
                        selectedExchanges={selectedExchanges} 
                        colors={colors} 
                    />
                </div>
                <div className="rounded-lg bg-gray-900 p-4 shadow-lg border border-purple-900/50">
                    <VolDist 
                        data={chartData} 
                        colors={colors} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                
                <div className="rounded-lg bg-gray-900 p-4 shadow-lg border border-purple-900/50">
                    <LiquidityScatterPlot 
                        data={chartData} 
                        colors={colors} 
                    />
                </div>
				<div className="col-span-2 rounded-lg bg-gray-900 p-4 shadow-lg border border-purple-900/50">
                    <SpreadChart 
                        chartData={chartData}
                        selectedExchanges={Array.from(exchange_set)}
                        colors={colors}
                    />
                </div>
            </div>
        </div>
    )
}

export default MasterCEX; 