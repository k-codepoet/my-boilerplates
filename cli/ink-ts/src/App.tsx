import { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";

export function App() {
  const { exit } = useApp();
  const [counter, setCounter] = useState(0);

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
    }
    if (key.upArrow || input === "k") {
      setCounter((c) => c + 1);
    }
    if (key.downArrow || input === "j") {
      setCounter((c) => c - 1);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
        flexDirection="column"
        alignItems="center"
      >
        <Text bold color="cyan">
          {" "}mycli - Ink TUI{" "}
        </Text>

        <Box marginTop={1}>
          <Text>Counter: </Text>
          <Text bold color="yellow">
            {counter}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>Press ↑/↓ to change, q to quit</Text>
        </Box>
      </Box>
    </Box>
  );
}
