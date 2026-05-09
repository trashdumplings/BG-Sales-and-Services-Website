import React from 'react';
import { motion } from 'framer-motion';

const RevealText = ({ children, delay = 0, className = "" }) => {
  return (
    <div style={{ overflow: 'hidden', display: 'inline-block' }} className={className}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default RevealText;
