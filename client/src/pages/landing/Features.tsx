import React from 'react';

const Features = () => {
  return (
    <section id="features" className="bg-gray-100 p-8">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-4">
            <h3 className="text-xl font-bold mb-2">Content Creation</h3>
            <p className="text-gray-700">Generate high-quality text, images, and more with a single click.</p>
          </div>
          <div className="p-4">
            <h3 className="text-xl font-bold mb-2">Creative Exploration</h3>
            <p className="text-gray-700">Explore new ideas and possibilities with AI-powered creative tools.</p>
          </div>
          <div className="p-4">
            <h3 className="text-xl font-bold mb-2">Code Generation</h3>
            <p className="text-gray-700">Accelerate your development process with AI-generated code snippets.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
