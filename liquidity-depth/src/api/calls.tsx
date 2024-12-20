// import { Buffer } from 'buffer';

// function hashStr(str: string): string {
// 	const base64 = Buffer.from(str).toString("base64");
// 	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
//   }

//   function hashList(list: string[]): string {
// 	const joined = list.join(",");
// 	const base64 = Buffer.from(joined).toString("base64");
// 	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
//   }

// export const handleSubmit = async (selectedExchanges: string[], selectedPair: string, startDateTime: string, endDateTime:string) => {
//     try {
// 	  const hashex = hashList(selectedExchanges);
// 	  const hashsym = hashStr(selectedPair);
// 	  const hashSTime = hashStr(startDateTime);
// 	  const hashETime = hashStr(endDateTime);
//       const response = await fetch(`http://18.191.137.252:1024/api/cex_pairs/${hashex}/${hashsym}/${hashSTime}/${hashETime}`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.ok) {
//         console.log(response.json());
//       } else {
//         const errorData = await response.json();
//         console.error("Submission failed:", errorData);
//         alert("Failed to submit exchanges.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       alert("An error occurred while submitting.");
//     }
//   };



// // export const cexReq = (selectedExchanges: string[], selectedPair: string, startDateTime: string, endDateTime:string) => {
// // 	try {
// // 		const hashex = hashList(selectedExchanges);
// // 		const hashsym = hashStr(selectedPair);
// // 		const hashSTime = hashStr(startDateTime);
// // 		const hashETime = hashStr(endDateTime);
// // 		const response = await fetch(`http://18.191.137.252:1024/api/cex_pairs/${hashex}/${hashsym}/${hashSTime}/${hashETime}`, {
// // 		  method: "GET",
// // 		  headers: {
// // 			"Content-Type": "application/json",
// // 		  },
// // 		});
  
// // 		if (response.ok) {
// // 		  console.log(response.json());
// // 		} else {
// // 		  const errorData = await response.json();
// // 		  console.error("Submission failed:", errorData);
// // 		  alert("Failed to submit exchanges.");
// // 		}
// // 	  } catch (error) {
// // 		console.error("Error:", error);
// // 		alert("An error occurred while submitting.");
// // 	  }
// // }