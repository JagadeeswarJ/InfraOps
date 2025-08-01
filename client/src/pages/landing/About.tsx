import React from 'react';

const About = () => {
  return (
    <section id="about" className="container mx-auto p-8">
      <h2 className="text-3xl font-bold text-center mb-8">What is Generative AI?</h2>
      <div className="flex flex-wrap items-center">
        <div className="w-full md:w-1/2 p-4">
          <p className="text-gray-700 leading-relaxed">
            Generative AI is a type of artificial intelligence that can create new content, such as text, images, music, and code. Unlike other forms of AI that are designed to recognize patterns and make predictions, generative AI models are built to generate new data that is similar to the data they were trained on.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            This technology has the potential to revolutionize many industries, from entertainment and art to software development and scientific research. It's a powerful tool for creativity and innovation, allowing us to explore new possibilities and solve problems in ways we never thought possible.
          </p>
        </div>
        <div className="w-full md:w-1/2 p-4">
          <img src="https://via.placeholder.com/500" alt="Generative AI" className="rounded-lg shadow-lg"/>
        </div>
      </div>
    </section>
  );
};

export default About;
