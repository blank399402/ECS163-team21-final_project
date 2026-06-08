# ECS163-team21-final_project

Here is the links to the observables we have:<br>
1. Grouped bar chart: https://observablehq.com/d/c798aaae39e6fb72<br>
2. Sankey diagram: https://observablehq.com/d/025c073b20115d96
3. Bubble chart: https://observablehq.com/d/75635c9d870d9dcf
4. Scatterplot screen time before sleep vs sleep hours & pie chart: https://observablehq.com/d/1faba6d3ddf2c2a1

With color scheme applied: <br>
1. Grouped bar chart: https://observablehq.com/d/74c427e42b1123ba
2. Sankey diagram (with scatter plot & pie chart): https://observablehq.com/d/4de94ae7f19c9829
3. Bubble chart: https://observablehq.com/d/471938b9223476b7

## Description
This repository contains the code and data files for our web-based interactive slideshow, which explores how social media affects the mental health of teenagers. We built the core visualization logic using D3.js to create a grouped bar chart, an interactive Sankey diagram, a scatter plot, a pie chart, and an animated bubble chart. All of these charts were originally developed and prototyped inside Observable notebooks. Once the individual charts were working correctly, we brought that JavaScript logic over and integrated it directly into our main project code so everything could run together as a single standalone website. 

The main entry point is the index.html file, which holds the overall presentation structure, the written text descriptions, the imported D3 libraries, and the custom chart scripts we migrated from Observable. It also contains the custom CSS layout rules we wrote to stop the charts from stretching too wide on larger screens. Because all of the data cleaning and preprocessing was already completed directly inside our Observable notebooks, there is no need to run any extra cleanup scripts or download additional files to launch the app.


## Installation

Clone the repository:

~~~sh
git clone https://github.com/blank399402/ECS163-team21-final_project.git
~~~

Navigate into the project directory:
~~~sh
cd ECS163-team21-final_project
~~~

## Execution

Launch a local HTTP server from the project root folder:
~~~sh
npx http-server
~~~

Copy and paste that address provided in your terminal into any web browser to open the interactive slideshow:
~~~sh
http://localhost:8080
~~~
