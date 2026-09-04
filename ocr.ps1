Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.WindowsRuntime,WindowsRuntime,Version=255.255.255.255,Culture=neutral,PublicKeyToken=null]
[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]|Out-Null
function Await($WinRtTask,$ResultType){$asTaskGeneric=([System.WindowsRuntimeSystemExtensions].GetMethods()|?{$_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'})[0];$asTask=$asTaskGeneric.MakeGenericMethod($ResultType);$netTask=$asTask.Invoke($null,@($WinRtTask));while(-not $netTask.IsCompleted){Start-Sleep -Milliseconds 100};$netTask.Result}
[Windows.Data.Xml.Dom.XmlDocument,Windows.Data.Xml.Dom.XmlDocument,ContentType=WindowsRuntime]|Out-Null
[Windows.Globalization.Language,Windows.Foundation,ContentType=WindowsRuntime]|Out-Null
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if(-not $engine){$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))}
if(-not $engine){Write-Output 'NO-OCR-ENGINE';exit}
foreach($p in @('card.png')){
  $f=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]::GetFileFromPathAsync((Resolve-Path $p).Path)
  $file=Await $f ([Windows.Storage.StorageFile])
  $so=$file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
  $stream=Await $so ([Windows.Storage.Streams.IRandomAccessStream])
  $dec=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]::CreateAsync($stream)
  $decoder=Await $dec ([Windows.Graphics.Imaging.BitmapDecoder])
  $bmpOp=$decoder.GetSoftwareBitmapAsync()
  $bmp=Await $bmpOp ([Windows.Graphics.Imaging.SoftwareBitmap])
  $ocrOp=$engine.RecognizeAsync($bmp)
  $res=Await $ocrOp ([Windows.Media.Ocr.OcrResult])
  Write-Output ('==== '+$p+' ====')
  Write-Output $res.Text
}
