export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const apiKey = process.env.UNISWAP_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Uniswap API key is not configured on the server.",
    });
  }

  try {
    const {
      tokenIn,
      tokenOut,
      tokenInChainId,
      tokenOutChainId,
      amount,
      swapper,
      slippageTolerance = 0.5,
    } = req.body ?? {};

    if (
      !tokenIn ||
      !tokenOut ||
      !tokenInChainId ||
      !tokenOutChainId ||
      !amount ||
      !swapper
    ) {
      return res.status(400).json({
        error: "Missing required swap quote parameters.",
      });
    }

    if (
      !Number.isFinite(Number(amount)) ||
      !/^\d+$/.test(String(amount)) ||
      BigInt(amount) <= 0n
    ) {
      return res.status(400).json({
        error: "Amount must be a positive integer in token base units.",
      });
    }

    if (
      !Number.isFinite(Number(slippageTolerance)) ||
      Number(slippageTolerance) < 0 ||
      Number(slippageTolerance) > 50
    ) {
      return res.status(400).json({
        error: "Invalid slippage tolerance.",
      });
    }

    const response = await fetch(
      "https://trade-api.gateway.uniswap.org/v1/quote",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          tokenIn,
          tokenOut,
          tokenInChainId: Number(tokenInChainId),
          tokenOutChainId: Number(tokenOutChainId),
          amount: String(amount),
          type: "EXACT_INPUT",
          swapper,
          slippageTolerance: Number(slippageTolerance),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Uniswap quote request failed:", response.status);

      return res.status(response.status).json({
        error:
          data.detail ||
          data.error ||
          "Unable to retrieve a swap quote.",
        errorCode: data.errorCode,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Quote endpoint error:", error.message);

    return res.status(500).json({
      error: "An unexpected error occurred while requesting a quote.",
    });
  }
}
