import { LedgerId } from "@hashgraph/sdk";

const getAllowance = async (networkSelected: LedgerId, accountId: string) => {
  try {
    const mirrornode = `https://${networkSelected}.mirrornode.hedera.com/api/v1/accounts/${accountId}/allowance`;
    const response = await fetch(mirrornode);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json()
    console.log(data)
  } catch (error) {
    console.error('Error fetching allowance:', error);
    throw error;
  }
}

export { getAllowance}