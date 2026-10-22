@chcp 65001 >nul
@echo off
cd /d %~dp0

:: CMD penceresini baştan 70 karakter genişliğe ve 30 satır yüksekliğe sabitle
mode con: cols=70 lines=30

:: Renk Değişkenleri Tanımı
set "YESIL=[92m"
set "SARI=[93m"
set "RENK_SIFIRLA=[0m"

:: ==========================================
:: YÖNETİCİ YETKİ KONTROLÜ
:: ==========================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    cls
    echo.
    echo %YESIL% =================================================================%RENK_SIFIRLA%
    echo %YESIL%                             U Y A R I                            %RENK_SIFIRLA%
    echo %YESIL% =================================================================%RENK_SIFIRLA%
    echo.
    echo  %SARI%Bu scripti çalıştırmak için dosyayı sağ tıklayıp "Yönetici olarak%RENK_SIFIRLA%
    echo  %SARI%çalıştır" seçeneğini kullanmalısınız!%RENK_SIFIRLA%
    echo.
    echo %YESIL% =================================================================%RENK_SIFIRLA%
    echo.
    echo  Program 5 saniye içinde kapatılacak...
    
    timeout /t 5 > nul
    exit /b
)

:: Menü
:menu
cls
:: Çerçeve ve Başlık Parlak Sarı (93m)
echo [93m======================================================================[0m
echo [93m                       SCRİPT ÇALIŞTIRMA MENÜSÜ                       [0m
echo [93m======================================================================[0m
echo.

:: Seçenekler
echo [96m [1] Projeyi Çalıştır (npm start)[0m
echo [96m [2] Projeyi Derle ve Optimize Et (npm run build)[0m
echo [96m [3] Projeye Node Yükle[0m
echo [96m [4] Projedeki Node Kurulumunu Kaldır[0m
echo [96m [5] Projenin Derleme ve Optimize Dosyalarını Sil[0m
echo [96m [6] Projenin Veritabanını Sil[0m
echo [91m [7] Çıkış Yap[0m
echo.

:: Yazıyı renkli olarak echo ile yazdırıp, choice komutunu arka planda çalıştırıyoruz
<nul set /p=%YESIL% Lütfen bir işlem seçin (1-7): %RENK_SIFIRLA%
choice /c 1234567 /n >nul

if errorlevel 7 goto cikis
if errorlevel 6 goto islem_6
if errorlevel 5 goto islem_5
if errorlevel 4 goto islem_4
if errorlevel 3 goto islem_3
if errorlevel 2 goto islem_2
if errorlevel 1 goto islem_1

:: Menü Seçenek 1
:islem_1
cls
echo [93m======================================================================[0m
echo [93m                       SCRİPT ÇALIŞTIRMA MENÜSÜ                       [0m
echo [93m======================================================================[0m
echo.
echo.
set "BULUNDU1=0"
if exist "%~dp0node_modules\" set "BULUNDU1=1"
if exist "%~dp0client\node_modules\" set "BULUNDU1=1"
if exist "%~dp0server\node_modules\" set "BULUNDU1=1"
if "%BULUNDU1%"=="0" (
    echo [91m Projede Node kurulumu yapılmamış![0m
    echo.
    timeout /t 2 >nul
    goto menu
)
echo Proje çalıştırılıyor...
start "" /min cmd /c "timeout /t 3 >nul & start http://localhost:3000"
npm start

:: Menü Seçenek 2
:islem_2
cls
echo [93m======================================================================[0m
echo [93m                       SCRİPT ÇALIŞTIRMA MENÜSÜ                       [0m
echo [93m======================================================================[0m
echo.
echo.
set "BULUNDU2=0"
if exist "%~dp0node_modules\" set "BULUNDU2=1"
if exist "%~dp0client\node_modules\" set "BULUNDU2=1"
if exist "%~dp0server\node_modules\" set "BULUNDU2=1"
if "%BULUNDU2%"=="0" (
    echo [91m Projede Node kurulumu yapılmamış![0m
    echo.
    timeout /t 2 >nul
    goto menu
)
echo Proje derleniyor ve optimize ediliyor...
npm run build
if %errorlevel% neq 0 (
    echo.
    echo [91m Derleme sırasında hata oluştu![0m
    echo.
    pause
    goto menu
)
echo.
echo İşlem tamamlandı!
echo.
timeout /t 2 >nul
goto menu

:: Menü Seçenek 3
:islem_3
cls
echo [93m======================================================================[0m
echo [93m                       SCRİPT ÇALIŞTIRMA MENÜSÜ                       [0m
echo [93m======================================================================[0m
echo.
echo.
echo Projeye Node kurulumu yapılıyor...
pushd "%~dp0server"
call npm install better-sqlite3@latest
set "HATA=%errorlevel%"
popd
if not "%HATA%"=="0" (
    echo.
    echo [91m Kurulum esnasında hata oluştu![0m
    echo.
    pause
    goto menu
)
pushd "%~dp0"
call npm run install:all
set "HATA=%errorlevel%"
popd
if not "%HATA%"=="0" (
    echo.
    echo [91m Kurulum esnasında hata oluştu![0m
    echo.
    pause
    goto menu
)
echo.
echo İşlem tamamlandı!
echo.
timeout /t 2 >nul
goto menu

:: Menü Seçenek 4
:islem_4
cls
echo [93m======================================================================[0m
echo [93m                       SCRİPT ÇALIŞTIRMA MENÜSÜ                       [0m
echo [93m======================================================================[0m
echo.
echo.
set "BULUNDU3=0"
if exist "%~dp0node_modules\" set "BULUNDU3=1"
if exist "%~dp0client\node_modules\" set "BULUNDU3=1"
if exist "%~dp0server\node_modules\" set "BULUNDU3=1"
if "%BULUNDU3%"=="0" (
    echo [91m Projede Node kurulumu yapılmamış![0m
    echo.
    timeout /t 2 >nul
    goto menu
)
echo [93m Projedeki Node kurulumu silinecek![0m
echo.
<nul set /p=%YESIL% Emin misiniz? (E/H): %RENK_SIFIRLA%
choice /c EH /n >nul
if errorlevel 2 goto menu
echo.
echo.
echo Projenin Node kurulumu siliniyor...
if exist "%~dp0node_modules\" rd /s /q "%~dp0node_modules"
if exist "%~dp0client\node_modules\" rd /s /q "%~dp0client\node_modules"
if exist "%~dp0server\node_modules\" rd /s /q "%~dp0server\node_modules"
echo.
echo Silme işlemi tamamlandı!
echo.
timeout /t 2 >nul
goto menu

:: Menü Seçenek 5
:islem_5
cls
echo [93m======================================================================[0m
echo [93m                       SCRİPT ÇALIŞTIRMA MENÜSÜ                       [0m
echo [93m======================================================================[0m
echo.
echo.
if not exist "%~dp0server\public\" (
    echo [91m Projenin server\public klasörü bulunamadı![0m
    echo.
    timeout /t 2 >nul
    goto menu
)
echo [93m Projenin derleme ve optimize klasör ve dosyaları silinecek![0m
echo.
<nul set /p=%YESIL% Emin misiniz? (E/H): %RENK_SIFIRLA%
choice /c EH /n >nul
if errorlevel 2 goto menu
echo.
echo.
echo Projenin derleme ve optimize klasör ve dosyaları siliniyor...
del /f /q "%~dp0server\public\*" >nul 2>&1
del /f /q /a:h "%~dp0server\public\*" >nul 2>&1
for /d %%D in ("%~dp0server\public\*") do rd /s /q "%%D"
echo.
echo Silme işlemi tamamlandı!
echo.
timeout /t 2 >nul
goto menu

:: Menü Seçenek 6
:islem_6
cls
echo [93m======================================================================[0m
echo [93m                       SCRİPT ÇALIŞTIRMA MENÜSÜ                       [0m
echo [93m======================================================================[0m
echo.
echo.
if not exist "%~dp0server\data\" (
    echo [91m Projenin server\data klasörü bulunamadı![0m
    echo.
    pause
    goto menu
)
echo [93m Projenin veritabanı silinecek![0m
echo.
<nul set /p=%YESIL% Emin misiniz? (E/H): %RENK_SIFIRLA%
choice /c EH /n >nul
if errorlevel 2 goto menu
echo.
echo.
echo Projenin veritabanı siliniyor...
del /f /q "%~dp0server\data\*" >nul 2>&1
del /f /q /a:h "%~dp0server\data\*" >nul 2>&1
for /d %%D in ("%~dp0server\data\*") do rd /s /q "%%D"
echo.
echo Silme işlemi tamamlandı!
echo.
timeout /t 2 >nul
goto menu

:: Menü Seçenek 7 (Çıkış)
:cikis
cls
echo [93m======================================================================[0m
echo [93m                       SCRİPT ÇALIŞTIRMA MENÜSÜ                       [0m
echo [93m======================================================================[0m
echo.
echo.
echo [91m Program kapatılıyor...[0m
timeout /t 3 >nul
exit
