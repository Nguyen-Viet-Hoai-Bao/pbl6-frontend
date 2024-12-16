"use client"; 

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, CategoryScale } from "chart.js";

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend, CategoryScale);

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface ApiData {
  id: number;
  imageUrl: string;
  predictionType: string;
  status: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [syntheticCounts, setSyntheticCounts] = useState<number[]>(new Array(31).fill(0));
  const [realCounts, setRealCounts] = useState<number[]>(new Array(31).fill(0));
  const [loading, setLoading] = useState<boolean>(true);
  const [apiData, setApiData] = useState<ApiData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch overview data for the chart
  useEffect(() => {
    const fetchAccessOverviewData = async () => {
        const accessToken = localStorage.getItem("access");

        if (!accessToken) {
            console.error("Không có access token");
            return;
        }

        const response = await fetch(`${apiUrl}/history`, {
            method: "GET", 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        setApiData(data.results);

        const { syntheticCounts, realCounts } = processApiOverviewData(data.results);
        setSyntheticCounts(syntheticCounts);
        setRealCounts(realCounts);

        setLoading(false);
    };

    fetchAccessOverviewData();
}, []);

  // Fetch paginated data for the table
  useEffect(() => {
    const fetchTableData = async () => {
      const accessToken = localStorage.getItem("access");

      if (!accessToken) {
        console.error("No access token found");
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/history?page=${currentPage}&limit=10`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();
        const tableData = processTableData(data.results);
        setApiData(tableData);
        setTotalPages(data.total_pages || 1);
      } catch (error) {
        console.error("Error fetching table data:", error);
      }
    };

    fetchTableData();
  }, [currentPage]);

  // Process overview data for the chart
  const processApiOverviewData = (data: any) => {
    // Khởi tạo mảng chứa số lượng Synthetic và Real cho mỗi ngày
    const syntheticCounts = new Array(31).fill(0); // 31 ngày
    const realCounts = new Array(31).fill(0); // 31 ngày

    data.forEach((item: any) => {
        if (item.results && item.results.prediction) {
            const predictionType = item.results.prediction.type;
            const createdAt = new Date(item.created_at);
            const day = createdAt.getDate() - 1; // Lấy ngày trong tháng (0-30)

            // Tăng số lượng cho Synthetic hoặc Real theo ngày
            if (predictionType === "Synthetic") {
                syntheticCounts[day] += 1;
            } else if (predictionType === "Real") {
                realCounts[day] += 1;
            }
        }
    });

    return { syntheticCounts, realCounts };
};

  // Process table data for the table
  const processTableData = (data: any[]) => {
    return data.map((item: any) => ({
      id: item.id,
      imageUrl: item.image_url,
      predictionType: item.results.prediction.type,
      status: item.results.status,
      createdAt: new Date(item.created_at).toLocaleString(),
    }));
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const labels = Array.from({ length: 31 }, (_, i) => i + 1); // Days of the month

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Synthetic Predictions",
        data: syntheticCounts,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
      {
        label: "Real Predictions",
        data: realCounts,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  };

  return (
    <div className="p-9 flex flex-col items-center justify-center space-y-4">
      <h1 className="text-5xl max-[500px]:text-2xl">Dashboard</h1>

      <div style={{ width: "100%", height: "400px" }} className="flex justify-center items-center">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Line data={chartData} />
        )}
      </div>

      {/* Table for displaying results */}
      <div className="table-container mt-8">
        <h2 className="text-xl mb-4">Danh sách kết quả</h2>
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Image</th>
              <th className="border px-4 py-2">Prediction Type</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {apiData.map((item) => (
              <tr key={item.id}>
                <td className="border px-4 py-2">{item.id}</td>
                <td className="border px-4 py-2">
                  <img src={item.imageUrl} alt="Prediction" className="w-20 h-20 object-cover" />
                </td>
                <td className="border px-4 py-2">{item.predictionType}</td>
                <td className="border px-4 py-2">{item.status}</td>
                <td className="border px-4 py-2">{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="pagination mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            Previous
          </button>
          <span className="mx-2">{currentPage}</span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            Next
          </button>
        </div>
      </div>

      <style jsx>{`
        .table-container {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          text-align: left;
          padding: 8px;
          border: 1px solid #ddd;
        }

        th {
          background-color: #f2f2f2;
        }

        td img {
          border-radius: 8px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .btn-pagination {
          padding: 4px 18px;
          margin: 0 10px;
          background-color: #007bff;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .btn-pagination:disabled {
          background-color: #d6d6d6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
