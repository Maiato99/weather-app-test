// Main React imports and third-party libraries
import React, { useEffect, useState, createContext, useContext, ReactNode } from "react";
import axios from "axios";
import styled, { createGlobalStyle } from "styled-components";
import { useFormik } from "formik";
import * as Yup from "yup";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Global styles for consistent UI look
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f5f5;
  }
`;

const Layout = styled.div`
  padding: 1.5rem;
  max-width: 850px;
  margin: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
`;

const Button = styled.button`
  padding: 0.75rem;
  background-color: #4e79a7;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #3b5c88;
  }
`;

const ErrorText = styled.div`
  color: red;
  font-size: 0.9rem;
`;

const WeatherImage = styled.img`
  width: 100px;
  height: 100px;
`;

const WeatherDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Logo = styled.img`
  width: 50px;
  height: 50px;
`;

const Heading = styled.h1`
  font-size: 1.75rem;
  color: #4e79a7;
  margin: 0;
`;

// Temperature unit context for toggling between Celsius and Fahrenheit
const UnitContext = createContext({
  unit: "metric",
  toggle: () => {},
});

const API_TOKEN = "532e524ebf5657e44968d0cc21a1d155"; //process.env.REACT_APP_WEATHER_API_KEY;

interface WeatherData {
  now: any;
  future: any[];
}

// Core WeatherApp component
const WeatherApp = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState({ lat: 0, lon: 0 });
  const [fetchError, setFetchError] = useState("");
  const { unit, toggle } = useContext(UnitContext);

  const formik = useFormik({
    initialValues: { cityName: "" },
    validationSchema: Yup.object({
      cityName: Yup.string().trim().required("Please enter a city name."),
    }),
    onSubmit: async ({ cityName }) => {
      if (!API_TOKEN) {
        setFetchError("API key is missing. Please check your .env configuration.");
        return;
      }

      try {
        const currentData = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_TOKEN}&units=${unit}`
        );
        const forecastData = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_TOKEN}&units=${unit}`
        );

        const dailyData = forecastData.data.list.filter((_: any, idx: number) => idx % 8 === 0);

        setWeather({
          now: currentData.data,
          future: dailyData,
        });

        setLocation({
          lat: currentData.data.coord.lat,
          lon: currentData.data.coord.lon,
        });

        setFetchError("");
      } catch (apiErr) {
        setFetchError("Oops! Couldn't retrieve data. Please double-check the city name or try again later.");
      }
    },
  });

  return (
    <Layout>
      <GlobalStyle />

      <TitleWrapper>
        <Logo src="https://cdn-icons-png.flaticon.com/512/1116/1116453.png" alt="Weather Icon" />
        <Heading>Weather Forecast App</Heading>
      </TitleWrapper>

      <StyledForm onSubmit={formik.handleSubmit}>
        <Input
          type="text"
          name="cityName"
          placeholder="Search for a city..."
          onChange={formik.handleChange}
          value={formik.values.cityName}
        />
        <Button type="submit">Get Weather</Button>
        {formik.errors.cityName && <ErrorText>{formik.errors.cityName}</ErrorText>}
      </StyledForm>

      <Button onClick={toggle} style={{ marginTop: "1rem" }}>
        Change to {unit === "metric" ? "Fahrenheit" : "Celsius"}
      </Button>

      {fetchError && <ErrorText>{fetchError}</ErrorText>}

      {weather && (
        <>
          <WeatherDetails>
            <WeatherImage
              src={`http://openweathermap.org/img/wn/${weather.now.weather[0].icon}@2x.png`}
              alt={weather.now.weather[0].description}
            />
            <h3>
              {weather.now.name}: {weather.now.main.temp}° {unit === "metric" ? "C" : "F"}
            </h3>
          </WeatherDetails>

          <LineChart width={600} height={300} data={weather.future.map((item: any) => ({
            name: new Date(item.dt_txt).toLocaleDateString(),
            temp: item.main.temp,
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temp" stroke="#4e79a7" strokeWidth={2} />
          </LineChart>

          <MapContainer center={[location.lat, location.lon]} zoom={10} style={{ height: "300px", width: "100%", marginTop: "1.5rem" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={[location.lat, location.lon]} />
          </MapContainer>
        </>
      )}
    </Layout>
  );
};

// Provider for managing temperature unit state
const UnitProvider = ({ children }: { children: ReactNode }) => {
  const [unit, setUnit] = useState("metric");
  const toggle = () => setUnit(prev => (prev === "metric" ? "imperial" : "metric"));

  return (
    <UnitContext.Provider value={{ unit, toggle }}>
      {children}
    </UnitContext.Provider>
  );
};

const App = () => (
  <UnitProvider>
    <WeatherApp />
  </UnitProvider>
);

export default App;
