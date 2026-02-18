import { motion } from "framer-motion";
import { TextShimmer } from "./text-shimmer";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-8 flex size-full max-w-xl flex-col items-center justify-center px-6 md:mt-24"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
        exit={{ opacity: 0, y: 12 }}
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-xl font-semibold text-center tracking-tight text-foreground md:text-3xl">
          <TextShimmer className="font-mono font-bold uppercase [--base-color:var(--color-blue-600)] [--base-gradient-color:var(--color-blue-200)] dark:[--base-color:var(--color-blue-700)] dark:[--base-gradient-color:var(--color-blue-400)]">
            Ulejra
          </TextShimmer>{" "}
          all in one Financial Agent
        </h1>
        <p className="text-xs font-normal text-center text-muted-foreground md:text-lg">
          Access your crypto portfolio in one place. Connect your exchange from
          the menu above your username to begin.
        </p>
      </motion.div>
    </div>
  );
};
