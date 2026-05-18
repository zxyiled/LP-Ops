# LP-Ops (Linear Programming Optimization Solver)

LP-Ops is an interactive web application designed to solve **Linear Programming** problems. It was developed as a Class Project (PIA) for the Operations Research course, featuring a dynamic approach that allows processing $N$ variables and $M$ constraints.

## 🚀 Main Functionality

The program allows you to:
* **Dynamic Input:** A form that adjusts to the dimensions required by the user to input decision variables and constraints.
* **Optimization Engine:** Processing maximization and minimization models using the **PuLP** mathematical engine.
* **Interactive Dashboard:** Displays optimal results for each variable as well as the objective function value.
* **Recommendation Cards:** An intelligent module that analyzes the result and generates helpful suggestions for decision-making.

## 🛠️ Technology Stack

* **Backend:** FastAPI, PuLP, Pydantic.
* **Frontend:** React, Vite, JavaScript.

## 📁 Project Structure

```
backend/
├── routers/
│   └── solver.py          # API endpoint for solving LP problems
├── schemas/
│   └── problem.py          # Pydantic models for request/response validation
├── services/
│   ├── recommendations.py  # Recommendation engine for solution analysis
│   └── solver_service.py   # PuLP/CBC solver logic
└── main.py                 # FastAPI entry point with CORS configuration

frontend/
├── src/
│   ├── components/
│   │   ├── ProblemForm.jsx        # Dynamic form for N variables & M constraints
│   │   ├── RecommendationCard.jsx # Individual recommendation card
│   │   └── ResultDashboard.jsx    # Solution metrics, tables, and recommendations
│   ├── services/
│   │   └── api.ts                 # HTTP client for the solver API
│   ├── styles/
│   │   └── main.css               # Application stylesheet (glassmorphism design)
│   ├── App.jsx                    # Main app shell with state management
│   └── main.jsx                   # React entry point
├── index.html
├── vite.config.js
├── tsconfig.json
└── package.json
```

## 🏗️ Architecture

```
User → ProblemForm.jsx → api.ts → POST /api/solver/solve → FastAPI → SolverService (PuLP/CBC) → SolveResponse → ResultDashboard
```

## 🧮 How to Use

1. **Start the backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn backend.main:app --reload --port 8000
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open **http://localhost:5173** in your browser.

4. Define your variables, objective function, and constraints, then click **"Resolver con PuLP"**.
